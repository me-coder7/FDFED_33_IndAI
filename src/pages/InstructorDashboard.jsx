import { useMemo, useState } from 'react'
import DashboardShell from '../components/DashboardShell.jsx'
import {
  Badge, CardHeader, EmptyState, Field, MiniLineChart, PageHeading,
  ProgressBar, ReturnValue, StatCard, StatusBadge, TabBar,
} from '../components/UI.jsx'
import { useData } from '../context/DataContext.jsx'
import { useOverlay } from '../context/OverlayContext.jsx'
import {
  averageLearnerReturn, fmtINR, fullName, getHoldings, getInstructorEarnings,
  getLearners, getUser,
} from '../utils/selectors.js'
import { minLength, required, validateFields, wholeNumber } from '../utils/validation.js'

const tabs = [
  { id: 'overview', label: 'Overview', icon: '▦' },
  { id: 'students', label: 'Students', icon: '♙' },
  { id: 'assignments', label: 'Assignments', icon: '▤' },
  { id: 'trading', label: 'My Trading', icon: '↗' },
  { id: 'analysis', label: 'Analysis', icon: '▥' },
  { id: 'earnings', label: 'Earnings', icon: '₹' },
  { id: 'history', label: 'History', icon: '◷' },
]

function AwardPointsForm({ students }) {
  const [learnerId, setLearnerId] = useState(students[0]?.id || '')
  const [points, setPoints] = useState(10)
  const [reason, setReason] = useState('Strong class participation')
  const [error, setError] = useState('')
  const { awardPoints } = useData()
  const { closeModal, showToast } = useOverlay()

  const submit = (event) => {
    event.preventDefault()
    const message = wholeNumber(points, 'Skill points', 1, 200) || minLength(reason, 'Reason', 3)
    if (message) return setError(message)
    awardPoints(learnerId, Number(points), reason)
    closeModal()
    showToast('Skill points awarded.')
  }

  return <form onSubmit={submit}><div className="modal-title">Award Skill Points</div><div className="modal-subtitle">Reward a learner for demonstrated progress.</div><Field label="Student"><select className="form-select" value={learnerId} onChange={(event) => setLearnerId(event.target.value)}>{students.map((student) => <option value={student.id} key={student.id}>{fullName(student)}</option>)}</select></Field><Field label="Points" error={error}><input className="form-input" type="number" min="1" max="200" value={points} onChange={(event) => { setPoints(event.target.value); setError('') }} /></Field><Field label="Reason"><input className="form-input" value={reason} onChange={(event) => setReason(event.target.value)} /></Field><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button><button className="btn btn-green">Award Points</button></div></form>
}

function AssignmentForm({ instructor, students }) {
  const [form, setForm] = useState({ title: '', description: '', dueDate: '', difficulty: 'Medium', skillPoints: 50 })
  const [errors, setErrors] = useState({})
  const { addAssignment } = useData()
  const { closeModal, showToast } = useOverlay()
  const change = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const submit = (event) => {
    event.preventDefault()
    const nextErrors = validateFields({
      title: [() => minLength(form.title, 'Title', 3)],
      description: [() => minLength(form.description, 'Description', 8)],
      dueDate: [() => required(form.dueDate, 'Due date')],
      skillPoints: [() => wholeNumber(form.skillPoints, 'Skill points', 1, 200)],
    })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    addAssignment({ ...form, skillPoints: Number(form.skillPoints), instructorId: instructor.id, studentIds: students.map((student) => student.id) })
    closeModal()
    showToast('Assignment created and sent to the class.')
  }
  return <form onSubmit={submit}><div className="modal-title">Create Assignment</div><div className="modal-subtitle">Assign a paper-trading exercise to all mapped students.</div><Field label="Title" error={errors.title}><input className="form-input" value={form.title} onChange={(event) => change('title', event.target.value)} /></Field><Field label="Description" error={errors.description}><textarea className="form-textarea" value={form.description} onChange={(event) => change('description', event.target.value)} /></Field><div className="form-row"><Field label="Due Date" error={errors.dueDate}><input className="form-input" type="date" value={form.dueDate} onChange={(event) => change('dueDate', event.target.value)} /></Field><Field label="Difficulty"><select className="form-select" value={form.difficulty} onChange={(event) => change('difficulty', event.target.value)}><option>Easy</option><option>Medium</option><option>Hard</option></select></Field></div><Field label="Skill Points" error={errors.skillPoints}><input className="form-input" type="number" min="1" max="200" value={form.skillPoints} onChange={(event) => change('skillPoints', event.target.value)} /></Field><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button><button className="btn btn-orange">Create Assignment</button></div></form>
}

function SessionForm({ instructor, students }) {
  const [form, setForm] = useState({ title: '', date: '', time: '10:00', duration: 60, type: 'Trading Session' })
  const [error, setError] = useState('')
  const { addSession } = useData()
  const { closeModal, showToast } = useOverlay()
  const change = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const submit = (event) => {
    event.preventDefault()
    const message = minLength(form.title, 'Session title', 3) || required(form.date, 'Date') || wholeNumber(form.duration, 'Duration', 15, 300)
    if (message) return setError(message)
    addSession({ ...form, duration: Number(form.duration), instructorId: instructor.id, studentIds: students.map((student) => student.id) })
    closeModal()
    showToast('Trading session scheduled.')
  }
  return <form onSubmit={submit}><div className="modal-title">Schedule Session</div><div className="modal-subtitle">Create a class meeting for assigned students.</div><Field label="Session Title" error={error}><input className="form-input" value={form.title} onChange={(event) => { change('title', event.target.value); setError('') }} /></Field><div className="form-row"><Field label="Date"><input className="form-input" type="date" value={form.date} onChange={(event) => change('date', event.target.value)} /></Field><Field label="Time"><input className="form-input" type="time" value={form.time} onChange={(event) => change('time', event.target.value)} /></Field></div><div className="form-row"><Field label="Duration (minutes)"><input className="form-input" type="number" value={form.duration} onChange={(event) => change('duration', event.target.value)} /></Field><Field label="Type"><select className="form-select" value={form.type} onChange={(event) => change('type', event.target.value)}><option>Trading Session</option><option>Review Session</option><option>Workshop</option><option>Lecture</option></select></Field></div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button><button className="btn btn-primary">Schedule</button></div></form>
}

function InstructorTradeForm({ stock, instructorId }) {
  const [type, setType] = useState('BUY')
  const [qty, setQty] = useState(1)
  const [error, setError] = useState('')
  const { executeTrade } = useData()
  const { closeModal, showToast } = useOverlay()
  const submit = (event) => {
    event.preventDefault()
    const result = executeTrade(instructorId, { symbol: stock.symbol, type, qty: Number(qty) })
    if (!result.success) return setError(result.message)
    closeModal(); showToast(result.message)
  }
  return <form onSubmit={submit}><div className="modal-title">Instructor Paper Trade</div><div className="modal-subtitle">{stock.symbol} · {stock.name} · {fmtINR(stock.price)}</div><div className="trade-type-switch"><button type="button" className={`btn ${type === 'BUY' ? 'btn-green' : 'btn-secondary'}`} onClick={() => setType('BUY')}>BUY</button><button type="button" className={`btn ${type === 'SELL' ? 'btn-danger' : 'btn-secondary'}`} onClick={() => setType('SELL')}>SELL</button></div><Field label="Quantity" error={error}><input className="form-input" type="number" min="1" value={qty} onChange={(event) => { setQty(event.target.value); setError('') }} /></Field><div className="report-card"><div className="report-metric"><span>Estimated total</span><strong>{fmtINR(stock.price * Number(qty || 0))}</strong></div></div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button><button className="btn btn-primary">Execute</button></div></form>
}

export default function InstructorDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [studentQuery, setStudentQuery] = useState('')
  const [historyQuery, setHistoryQuery] = useState('')
  const [historyType, setHistoryType] = useState('')
  const [marketQuery, setMarketQuery] = useState('')
  const { data } = useData()
  const { openModal, closeModal, showToast } = useOverlay()
  const user = getUser(data, 'u3')
  const students = getLearners(data).filter((student) => (user.studentIds || []).includes(student.id))
  const assignments = data.assignments.filter((item) => item.instructorId === user.id)
  const sessions = data.sessions.filter((item) => item.instructorId === user.id)
  const allStudentTrades = data.trades.filter((trade) => students.some((student) => student.id === trade.learnerId))
  const instructorTrades = data.trades.filter((trade) => trade.learnerId === user.id)
  const holdings = getHoldings(data, user.id)
  const earnings = getInstructorEarnings(data, user.id)
  const avgReturn = averageLearnerReturn(data, students)
  const sortedStudents = [...students].sort((a, b) => b.portfolioValue - a.portfolioValue)
  const visibleStudents = sortedStudents.filter((student) => `${fullName(student)} ${student.email}`.toLowerCase().includes(studentQuery.toLowerCase()))
  const filteredHistory = allStudentTrades.filter((trade) => {
    const learner = getUser(data, trade.learnerId)
    return (!historyType || trade.type === historyType) && (!historyQuery || `${trade.symbol} ${fullName(learner)}`.toLowerCase().includes(historyQuery.toLowerCase()))
  })
  const marketStocks = data.stocks.filter((stock) => `${stock.symbol} ${stock.name}`.toLowerCase().includes(marketQuery.toLowerCase())).slice(0, 14)

  const showNotifications = () => {
    const items = data.notifications.filter((item) => item.userId === user.id)
    openModal(<><div className="modal-title">Instructor Notifications</div><div className="modal-subtitle">Your class and platform updates</div>{items.length ? items.map((item) => <div className="notif-row" key={item.id}><span className="notif-dot blue-dot" /><span><strong>{item.message}</strong><small>{item.createdAt}</small></span></div>) : <EmptyState title="No notifications" />}<div className="modal-footer"><button className="btn btn-primary" onClick={closeModal}>Close</button></div></>)
  }

  const overview = <><div className="grid-2"><div className="card"><CardHeader title="Class Performance Leaderboard" subtitle="Top performing students this month" action={<button className="btn btn-green btn-sm" onClick={() => openModal(<AwardPointsForm students={students} />)}>Award Points</button>} />{sortedStudents.slice(0, 5).map((student, index) => { const ret = ((student.portfolioValue - 100000) / 100000) * 100; return <div className="leaderboard-row" key={student.id}><span className={`rank-badge ${index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : ''}`}>{index + 1}</span><span><strong>{fullName(student)}</strong><small>{student.skillPoints} SP</small></span><span className="align-right"><ReturnValue value={ret} /><small>{fmtINR(student.portfolioValue)}</small></span></div> })}</div><div className="card"><CardHeader title="Recent Activity" subtitle="Latest student actions and achievements" />{allStudentTrades.slice(0, 4).map((trade) => <div className="activity-item" key={trade.id}><div className="activity-dot" style={{ background: trade.type === 'BUY' ? 'var(--green)' : 'var(--red)' }} /><div><strong>{fullName(getUser(data, trade.learnerId))} {trade.type.toLowerCase()} {trade.symbol}</strong><div className="text-sm text-gray">{trade.qty} shares · {trade.date}</div></div></div>)}<div className="divider" /><CardHeader title="Upcoming Sessions" action={<button className="btn btn-primary btn-sm" onClick={() => openModal(<SessionForm instructor={user} students={students} />)}>+ Schedule</button>} />{sessions.filter((item) => item.status === 'scheduled').slice(0, 2).map((session) => <div className="session-card" key={session.id}><div><strong>{session.title}</strong><div className="text-sm text-gray">{session.date} · {session.time}</div></div><Badge tone="blue">{session.type}</Badge></div>)}</div></div><div className="card mt-24"><CardHeader title="Active Assignments" subtitle="Monitor assignment progress" action={<button className="btn btn-orange btn-sm" onClick={() => openModal(<AssignmentForm instructor={user} students={students} />)}>+ New Assignment</button>} />{assignments.filter((item) => item.status === 'active').map((assignment) => <div className="assignment-card" key={assignment.id}><div className="flex-between"><strong>{assignment.title}</strong><span className="text-sm text-gray">Due {assignment.dueDate}</span></div><div className="assignment-metrics"><div><strong>{assignment.studentIds.length}</strong><span>Assigned</span></div><div><strong>{assignment.completedIds.length}</strong><span>Completed</span></div><div><strong>{assignment.studentIds.length - assignment.completedIds.length}</strong><span>In progress</span></div></div></div>)}</div></>

  const studentsView = <><PageHeading title="Student Management" subtitle="Monitor and manage your assigned students" action={<input className="form-input compact-search" value={studentQuery} onChange={(event) => setStudentQuery(event.target.value)} placeholder="Search students..." />} />{visibleStudents.map((student, index) => { const ret = ((student.portfolioValue - 100000) / 100000) * 100; return <div className="student-card" key={student.id}><div className="flex-center gap-16"><span className={`rank-badge ${index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : ''}`}>{index + 1}</span><div><strong>{fullName(student)}</strong><div className="text-sm text-gray">{student.email} · {student.studentId}</div></div></div><div className="student-metrics"><span><small>Portfolio</small><strong>{fmtINR(student.portfolioValue)}</strong></span><span><small>Return</small><ReturnValue value={ret} /></span><span><small>Skill Points</small><strong className="text-orange">{student.skillPoints}</strong></span></div><button className="btn btn-green btn-sm" onClick={() => openModal(<AwardPointsForm students={[student]} />)}>Award Points</button></div>})}</>

  const assignmentsView = <><PageHeading title="Assignments & Sessions" subtitle="Manage trading exercises and class schedules" action={<div className="row-actions"><button className="btn btn-orange btn-sm" onClick={() => openModal(<AssignmentForm instructor={user} students={students} />)}>+ New Assignment</button><button className="btn btn-primary btn-sm" onClick={() => openModal(<SessionForm instructor={user} students={students} />)}>Schedule Session</button></div>} /><h4 className="section-label">Trading Assignments</h4>{assignments.map((assignment) => <div className="assignment-card" key={assignment.id}><div className="flex-between"><div><strong>{assignment.title}</strong><p>{assignment.description}</p></div><StatusBadge status={assignment.status} /></div><div className="flex-between mt-16"><span className="text-sm text-gray">Due {assignment.dueDate} · {assignment.skillPoints} SP · {assignment.difficulty}</span><span>{assignment.completedIds.length}/{assignment.studentIds.length} complete</span></div><ProgressBar value={(assignment.completedIds.length / assignment.studentIds.length) * 100} tone="green" /></div>)}<h4 className="section-label mt-24">Trading Sessions</h4>{sessions.map((session) => <div className="session-card" key={session.id}><div><strong>{session.title}</strong><div className="text-sm text-gray">{session.date} · {session.time} · {session.duration} minutes</div></div><StatusBadge status={session.status} /></div>)}</>

  const tradingView = <><div className="stat-grid"><StatCard label="Portfolio Value" value={fmtINR(user.portfolioValue)} sub="Instructor paper account" /><StatCard label="Virtual Cash" value={fmtINR(user.virtualBalance)} sub="Available to trade" tone="green" /><StatCard label="Holdings" value={holdings.length} sub="Open stock positions" tone="orange" /><StatCard label="Trades" value={instructorTrades.length} sub="Executed orders" tone="blue" /></div><div className="grid-2"><div className="card"><CardHeader title="My Portfolio" subtitle="Personal paper-trading account" />{holdings.length ? holdings.map((holding) => <div className="holding-row" key={holding.symbol}><div><strong>{holding.symbol}</strong><div className="text-sm text-gray">{holding.qty} shares</div></div><div className="align-right"><strong>{fmtINR(holding.currentValue)}</strong><ReturnValue value={holding.returnPct} /></div></div>) : <EmptyState icon="▦" title="No instructor holdings" message="Use Market Explorer to place a trade." />}</div><div className="card"><CardHeader title="Class Trading Overview" subtitle="Combined assigned learner performance" /><MiniLineChart values={sortedStudents.map((student) => student.portfolioValue)} height={150} /><div className="report-metric"><span>Class average return</span><strong className="positive">{avgReturn.toFixed(2)}%</strong></div><div className="report-metric"><span>Total class trades</span><strong>{allStudentTrades.length}</strong></div></div></div><div className="card mt-24"><CardHeader title="Market Explorer" subtitle="Discover and trade stocks" action={<input className="form-input compact-search" value={marketQuery} onChange={(event) => setMarketQuery(event.target.value)} placeholder="Search market..." />} />{marketStocks.map((stock) => <div className="stock-row" key={stock.symbol}><div><strong>{stock.symbol}</strong><div className="text-sm text-gray">{stock.name} · {stock.sector}</div></div><div className="stock-row-right"><strong>{fmtINR(stock.price)}</strong><ReturnValue value={stock.change} /><button className="btn btn-primary btn-sm" onClick={() => openModal(<InstructorTradeForm stock={stock} instructorId={user.id} />)}>Trade</button></div></div>)}</div></>

  const analysisView = <><PageHeading title="Portfolio Analysis" subtitle="Deep performance insights for your class" action={<button className="btn btn-primary btn-sm" onClick={() => showToast('Analysis report prepared for export.', 'info')}>Export Report</button>} /><div className="analytics-grid"><div className="analytics-card"><div className="ac-value text-blue">{fmtINR(students.reduce((sum, item) => sum + item.portfolioValue, 0))}</div><div className="ac-label">Combined Portfolio Value</div></div><div className="analytics-card"><div className="ac-value positive">+{avgReturn.toFixed(2)}%</div><div className="ac-label">Class Average Return</div></div><div className="analytics-card"><div className="ac-value text-orange">{students.reduce((sum, item) => sum + item.skillPoints, 0)}</div><div className="ac-label">Combined Skill Points</div></div></div><div className="card mt-24"><CardHeader title="Student Performance Reports" /><div className="table-wrap"><table><thead><tr><th>Student</th><th>Portfolio</th><th>Return</th><th>Skill Points</th><th>Risk</th></tr></thead><tbody>{sortedStudents.map((student) => <tr key={student.id}><td><strong>{fullName(student)}</strong></td><td>{fmtINR(student.portfolioValue)}</td><td><ReturnValue value={((student.portfolioValue - 100000) / 100000) * 100} /></td><td>{student.skillPoints}</td><td><Badge tone={student.riskTolerance === 'high' ? 'red' : student.riskTolerance === 'moderate' ? 'orange' : 'green'}>{student.riskTolerance}</Badge></td></tr>)}</tbody></table></div></div></>

  const earningsView = <><PageHeading title="Instructor Earnings" subtitle="Monthly compensation per active student with skill-growth bonuses" /><div className="stat-grid"><StatCard label="Active Students" value={earnings.activeStudents} sub="Mapped learner accounts" /><StatCard label="Rate / Student" value={fmtINR(earnings.perStudentMonthlyRate)} sub="Payment Admin controlled" tone="blue" /><StatCard label="Base Monthly" value={fmtINR(earnings.baseMonthlyEarning)} sub="Students × monthly rate" tone="green" /><StatCard label="Bonus" value={fmtINR(earnings.performanceBonus)} sub="Skill-growth incentives" tone="orange" /></div><div className="grid-2"><div className="card"><CardHeader title="Monthly Calculation" subtitle="Transparent compensation breakdown" /><div className="report-card"><div className="report-metric"><span>{earnings.activeStudents} active students × {fmtINR(earnings.perStudentMonthlyRate)}</span><strong>{fmtINR(earnings.baseMonthlyEarning)}</strong></div><div className="report-metric"><span>Performance bonus</span><strong>{fmtINR(earnings.performanceBonus)}</strong></div><div className="report-metric"><span>Total projected earning</span><strong className="positive">{fmtINR(earnings.totalMonthlyEarning)}</strong></div></div></div><div className="card"><CardHeader title="Bonus & Payout History" subtitle="Performance incentives sanctioned by Payment Admin" />{earnings.payouts.length ? earnings.payouts.map((payout) => <div className="holding-row" key={payout.id}><div><strong>{payout.reason}</strong><div className="text-sm text-gray">{payout.paidAt} · {payout.type}</div></div><strong className="positive">{fmtINR(payout.amount)}</strong></div>) : <EmptyState title="No payouts yet" />}</div></div></>

  const historyView = <><PageHeading title="Trade History" subtitle="Complete record of all assigned student trades" action={<div className="row-actions"><input className="form-input compact-search" value={historyQuery} onChange={(event) => setHistoryQuery(event.target.value)} placeholder="Search symbol or student..." /><select className="form-select compact-select" value={historyType} onChange={(event) => setHistoryType(event.target.value)}><option value="">All Types</option><option value="BUY">BUY</option><option value="SELL">SELL</option></select></div>} /><div className="card"><div className="table-wrap"><table><thead><tr><th>Student</th><th>Symbol</th><th>Type</th><th>Qty</th><th>Price</th><th>Total</th><th>Date</th><th>Status</th></tr></thead><tbody>{filteredHistory.map((trade) => <tr key={trade.id}><td><strong>{fullName(getUser(data, trade.learnerId))}</strong></td><td>{trade.symbol}</td><td><span className={`trade-tag ${trade.type.toLowerCase()}`}>{trade.type}</span></td><td>{trade.qty}</td><td>{fmtINR(trade.price)}</td><td>{fmtINR(trade.total)}</td><td>{trade.date}</td><td><StatusBadge status={trade.status} /></td></tr>)}</tbody></table></div></div></>

  const views = { overview, students: studentsView, assignments: assignmentsView, trading: tradingView, analysis: analysisView, earnings: earningsView, history: historyView }

  return <DashboardShell user={user} onNotifications={showNotifications} info={<div className="nav-info green-info"><span className="nav-info-label">Students</span><span className="nav-info-value">{students.length}</span></div>}><main className="dashboard-content instructor-dashboard"><div className="stat-grid"><StatCard label="Total Students" value={students.length} sub="Assigned to you" /><StatCard label="Class Avg Returns" value={`+${avgReturn.toFixed(2)}%`} sub="Across mapped learners" tone="green" /><StatCard label="Avg Skill Points" value={Math.round(students.reduce((sum, item) => sum + item.skillPoints, 0) / Math.max(students.length, 1))} sub="Class learning progress" tone="orange" /><StatCard label="Top Performer" value={sortedStudents[0]?.firstName || '—'} sub={sortedStudents[0] ? fmtINR(sortedStudents[0].portfolioValue) : 'No students'} tone="blue" /></div><TabBar tabs={tabs} activeTab={activeTab} onChange={setActiveTab} /><section className="view-section active">{views[activeTab]}</section></main></DashboardShell>
}
