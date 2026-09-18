import { useMemo, useState } from 'react'
import DashboardShell from '../components/DashboardShell.jsx'
import MarketTicker from '../components/MarketTicker.jsx'
import {
  Badge, CardHeader, EmptyState, Field, MiniLineChart, PageHeading,
  ProgressBar, ReturnValue, StatCard, StatusBadge, TabBar,
} from '../components/UI.jsx'
import { useData } from '../context/DataContext.jsx'
import { useOverlay } from '../context/OverlayContext.jsx'
import {
  fmtINR, fullName, getActiveWatchlist, getHoldings, getInstructors, getUser,
} from '../utils/selectors.js'
import { minLength, required, validateFields, wholeNumber } from '../utils/validation.js'

const tabs = [
  { id: 'portfolio', label: 'Portfolio', icon: '▦' },
  { id: 'watchlist', label: 'Watchlist', icon: '☆' },
  { id: 'trading', label: 'Trading', icon: '↗' },
  { id: 'challenges', label: 'Challenges', icon: '◇' },
  { id: 'learning', label: 'Learning', icon: '▤' },
  { id: 'subscription', label: 'Subscription', icon: '▣' },
  { id: 'notifications', label: 'Notifications', icon: '○' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
]

function TradeForm({ stock, userId }) {
  const [type, setType] = useState('BUY')
  const [qty, setQty] = useState(1)
  const [error, setError] = useState('')
  const { executeTrade } = useData()
  const { closeModal, showToast } = useOverlay()
  const total = Number(stock.price) * Number(qty || 0)

  const submit = (event) => {
    event.preventDefault()
    const message = wholeNumber(qty, 'Quantity', 1, 100000)
    if (message) return setError(message)
    const result = executeTrade(userId, { symbol: stock.symbol, type, qty: Number(qty) })
    if (!result.success) return setError(result.message)
    closeModal()
    showToast(result.message)
  }

  return (
    <form onSubmit={submit}>
      <div className="modal-title">Place Paper Trade</div>
      <div className="modal-subtitle">React-controlled order form using the original virtual portfolio data.</div>
      <div className="trade-modal-stock flex-between">
        <div><strong>{stock.symbol}</strong><div className="text-sm text-gray">{stock.name}</div></div>
        <div className="text-bold">{fmtINR(stock.price)} <ReturnValue value={stock.change} /></div>
      </div>
      <div className="trade-type-switch">
        <button type="button" className={`btn ${type === 'BUY' ? 'btn-green' : 'btn-secondary'}`} onClick={() => setType('BUY')}>BUY</button>
        <button type="button" className={`btn ${type === 'SELL' ? 'btn-danger' : 'btn-secondary'}`} onClick={() => setType('SELL')}>SELL</button>
      </div>
      <Field label="Quantity" error={error}>
        <input className={`form-input ${error ? 'input-error' : ''}`} type="number" min="1" value={qty} onChange={(event) => { setQty(event.target.value); setError('') }} />
      </Field>
      <div className="report-card">
        <div className="report-metric"><span>Market price</span><strong>{fmtINR(stock.price)}</strong></div>
        <div className="report-metric"><span>Estimated total</span><strong>{fmtINR(total)}</strong></div>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
        <button className={type === 'BUY' ? 'btn btn-green' : 'btn btn-danger'}>Execute {type}</button>
      </div>
    </form>
  )
}

function ProfileSettings({ user }) {
  const { updateUser } = useData()
  const { showToast } = useOverlay()
  const [form, setForm] = useState({
    firstName: user.firstName, lastName: user.lastName, email: user.email,
    institution: user.institution || '', riskTolerance: user.riskTolerance || 'moderate',
  })
  const [errors, setErrors] = useState({})
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' })

  const change = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const save = (event) => {
    event.preventDefault()
    const nextErrors = validateFields({
      firstName: [() => minLength(form.firstName, 'First name', 2)],
      lastName: [() => minLength(form.lastName, 'Last name', 2)],
      email: [() => required(form.email, 'Email')],
    })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    updateUser(user.id, form)
    showToast('Profile settings saved.')
  }

  const updatePassword = (event) => {
    event.preventDefault()
    if (passwords.current !== user.password) return showToast('Current password is incorrect.', 'error')
    if (passwords.next.length < 8) return showToast('New password must contain at least 8 characters.', 'error')
    if (passwords.next !== passwords.confirm) return showToast('New passwords do not match.', 'error')
    updateUser(user.id, { password: passwords.next })
    setPasswords({ current: '', next: '', confirm: '' })
    showToast('Password changed.')
  }

  return (
    <div className="grid-2">
      <form className="card" onSubmit={save}>
        <CardHeader title="Profile Settings" subtitle="Update your learner details" />
        <div className="form-row">
          <Field label="First Name" error={errors.firstName}><input className="form-input" value={form.firstName} onChange={(event) => change('firstName', event.target.value)} /></Field>
          <Field label="Last Name" error={errors.lastName}><input className="form-input" value={form.lastName} onChange={(event) => change('lastName', event.target.value)} /></Field>
        </div>
        <Field label="Email" error={errors.email}><input className="form-input" type="email" value={form.email} onChange={(event) => change('email', event.target.value)} /></Field>
        <Field label="Institution"><input className="form-input" value={form.institution} onChange={(event) => change('institution', event.target.value)} /></Field>
        <Field label="Risk Tolerance"><select className="form-select" value={form.riskTolerance} onChange={(event) => change('riskTolerance', event.target.value)}><option value="low">Low</option><option value="moderate">Moderate</option><option value="high">High</option></select></Field>
        <button className="btn btn-primary">Save Settings</button>
      </form>
      <form className="card" onSubmit={updatePassword}>
        <CardHeader title="Change Password" subtitle="Controlled inputs with React validation" />
        <Field label="Current Password"><input className="form-input" type="password" value={passwords.current} onChange={(event) => setPasswords({ ...passwords, current: event.target.value })} /></Field>
        <Field label="New Password"><input className="form-input" type="password" value={passwords.next} onChange={(event) => setPasswords({ ...passwords, next: event.target.value })} /></Field>
        <Field label="Confirm New Password"><input className="form-input" type="password" value={passwords.confirm} onChange={(event) => setPasswords({ ...passwords, confirm: event.target.value })} /></Field>
        <button className="btn btn-primary">Change Password</button>
      </form>
    </div>
  )
}

export default function LearnerDashboard() {
  const [activeTab, setActiveTab] = useState('portfolio')
  const [query, setQuery] = useState('')
  const [cap, setCap] = useState('All')
  const [sector, setSector] = useState('All')
  const [period, setPeriod] = useState('1M')
  const { data, addWatchlistSymbol, removeWatchlistSymbol, completeChallenge, enrollCourse, choosePlan, markNotification, markAllNotifications } = useData()
  const { openModal, showToast } = useOverlay()
  const user = getUser(data, 'u6')
  const holdings = useMemo(() => getHoldings(data, user.id), [data, user.id])
  const trades = useMemo(() => data.trades.filter((trade) => trade.learnerId === user.id).slice().reverse(), [data.trades, user.id])
  const watchlist = getActiveWatchlist(data, user.id)
  const watchStocks = (watchlist?.symbols || []).map((symbol) => data.stocks.find((stock) => stock.symbol === symbol)).filter(Boolean)
  const enrollments = data.enrollments.filter((item) => item.learnerId === user.id)
  const notifications = data.notifications.filter((item) => item.userId === user.id)
  const instructors = getInstructors(data)
  const instructor = instructors.find((item) => item.id === user.instructorId)

  const marketStocks = useMemo(() => data.stocks.filter((stock) => {
    const searchMatch = !query || `${stock.symbol} ${stock.name}`.toLowerCase().includes(query.toLowerCase())
    return searchMatch && (cap === 'All' || stock.cap === cap) && (sector === 'All' || stock.sector === sector)
  }), [data.stocks, query, cap, sector])

  const openTrade = (stock, defaultType = 'BUY') => {
    openModal(<TradeForm stock={stock} userId={user.id} defaultType={defaultType} />)
  }

  const openStockFromTicker = (symbol) => {
    setActiveTab('trading')
    setQuery(symbol)
  }

  const portfolioValues = {
    '1W': [101000, 103500, 102800, 105400, 108500],
    '1M': [97000, 99100, 100600, 101800, 104200, 103900, 108500],
    '3M': [92000, 94000, 98500, 97000, 101000, 105000, 108500],
    '1Y': [100000, 96000, 99000, 103000, 101500, 106000, 108500],
  }

  const portfolioView = (
    <>
      <div className="grid-2">
        <div className="card">
          <CardHeader
            title="Portfolio Growth"
            subtitle="Track your portfolio performance over time"
            action={<div className="period-buttons">{Object.keys(portfolioValues).map((key) => <button key={key} className={`btn btn-sm ${period === key ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPeriod(key)}>{key}</button>)}</div>}
          />
          <div className="metric-strip">
            <div><span>Current Value</span><strong>{fmtINR(user.portfolioValue)}</strong></div>
            <div><span>Total Returns</span><strong className="gain">+{(((user.portfolioValue - 100000) / 100000) * 100).toFixed(2)}%</strong></div>
            <div><span>Cash Balance</span><strong>{fmtINR(user.virtualBalance)}</strong></div>
          </div>
          <MiniLineChart values={portfolioValues[period]} />
        </div>
        <div className="card">
          <CardHeader title="Holdings" subtitle="Your current stock positions" />
          {holdings.length ? holdings.slice(0, 6).map((holding) => (
            <div className="holding-row" key={holding.symbol}>
              <div><strong>{holding.symbol}</strong><div className="text-sm text-gray">{holding.qty} shares · Avg {fmtINR(holding.averagePrice)}</div></div>
              <div className="align-right"><strong>{fmtINR(holding.currentValue)}</strong><div><ReturnValue value={holding.returnPct} /></div></div>
            </div>
          )) : <EmptyState icon="▦" title="No holdings yet" message="Place your first paper trade." />}
          <div className="divider" />
          <CardHeader title="Portfolio Analyzer" subtitle="Rule-based insights from your current portfolio" />
          <div className="insight-pill strength">✓ Portfolio return is above the ₹1,00,000 starting value.</div>
          <div className="insight-pill area">! Diversify across more sectors to reduce concentration risk.</div>
          <div className="insight-pill info">i Instructor: {fullName(instructor)}</div>
        </div>
      </div>
      <div className="card mt-24">
        <CardHeader title="Trade History" subtitle="All your executed paper trades" />
        <div className="table-wrap"><table><thead><tr><th>Symbol</th><th>Type</th><th>Quantity</th><th>Price</th><th>Total</th><th>Date</th><th>Status</th></tr></thead><tbody>
          {trades.map((trade) => <tr key={trade.id}><td><strong>{trade.symbol}</strong></td><td><span className={`trade-tag ${trade.type.toLowerCase()}`}>{trade.type}</span></td><td>{trade.qty}</td><td>{fmtINR(trade.price)}</td><td>{fmtINR(trade.total)}</td><td>{trade.date}</td><td><StatusBadge status={trade.status} /></td></tr>)}
        </tbody></table></div>
      </div>
    </>
  )

  const watchlistView = (
    <>
      <PageHeading title="Watchlist" subtitle="Stocks you're monitoring" />
      <div className="card mb-16">
        <Field label="Search to add a stock"><input className="form-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by symbol or company name..." /></Field>
        {query && <div className="search-result-grid">{data.stocks.filter((stock) => `${stock.symbol} ${stock.name}`.toLowerCase().includes(query.toLowerCase()) && !(watchlist?.symbols || []).includes(stock.symbol)).slice(0, 5).map((stock) => <button className="search-result" key={stock.symbol} onClick={() => { addWatchlistSymbol(user.id, stock.symbol); showToast(`${stock.symbol} added to watchlist.`); setQuery('') }}><span><strong>{stock.symbol}</strong><small>{stock.name}</small></span><span>+ Add</span></button>)}</div>}
      </div>
      <div className="card">
        {watchStocks.length ? <div className="table-wrap"><table><thead><tr><th>Stock</th><th>Sector</th><th>Price</th><th>Change</th><th>Action</th></tr></thead><tbody>{watchStocks.map((stock) => <tr key={stock.symbol}><td><strong>{stock.symbol}</strong><div className="text-sm text-gray">{stock.name}</div></td><td>{stock.sector}</td><td>{fmtINR(stock.price)}</td><td><ReturnValue value={stock.change} /></td><td><div className="row-actions"><button className="btn btn-primary btn-sm" onClick={() => openTrade(stock)}>Trade</button><button className="btn btn-secondary btn-sm" onClick={() => removeWatchlistSymbol(user.id, stock.symbol)}>Remove</button></div></td></tr>)}</tbody></table></div> : <EmptyState icon="☆" title="Your watchlist is empty" />}
      </div>
    </>
  )

  const tradingView = (
    <>
      <PageHeading title="Market Explorer" subtitle="Discover and analyze stocks across all sectors" />
      <div className="card mb-16">
        <input className="form-input mb-16" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by symbol or company name..." />
        <div className="filter-chips">{['All', 'Large Cap', 'Mid Cap', 'Small Cap'].map((item) => <button className={`chip ${cap === item ? 'active' : ''}`} key={item} onClick={() => setCap(item)}>{item}</button>)}</div>
        <div className="filter-chips">{['All', 'IT', 'Banking', 'Energy', 'FMCG', 'Pharma', 'Automobile', 'Telecom', 'Infrastructure', 'Power', 'Technology'].map((item) => <button className={`cat-chip ${sector === item ? 'active' : ''}`} key={item} onClick={() => setSector(item)}>{item}</button>)}</div>
      </div>
      <div className="grid-3 mb-16">
        {[['Top Gainers', [...data.stocks].sort((a, b) => b.change - a.change).slice(0, 3), 'green'], ['Top Losers', [...data.stocks].sort((a, b) => a.change - b.change).slice(0, 3), 'red'], ['Most Active', [...data.stocks].sort((a, b) => parseFloat(b.vol) - parseFloat(a.vol)).slice(0, 3), 'blue']].map(([title, items, tone]) => <div className="card" key={title}><div className={`mover-title ${tone}`}>{title}</div>{items.map((stock) => <button className="market-mover-row" key={stock.symbol} onClick={() => { setQuery(stock.symbol); setCap('All'); setSector('All') }}><strong>{stock.symbol}</strong><ReturnValue value={stock.change} /></button>)}</div>)}
      </div>
      <div className="card">
        <CardHeader title={`${marketStocks.length} Stocks`} subtitle="Original IndAI market records" />
        {marketStocks.slice(0, 25).map((stock) => <div className="stock-row" key={stock.symbol}><div><strong>{stock.symbol}</strong><div className="text-sm text-gray">{stock.name} · {stock.sector} · {stock.cap}</div></div><div className="stock-row-right"><div><strong>{fmtINR(stock.price)}</strong><ReturnValue value={stock.change} /></div><button className="btn btn-green btn-sm" onClick={() => openTrade(stock)}>Trade</button><button className="btn btn-secondary btn-sm" onClick={() => addWatchlistSymbol(user.id, stock.symbol)}>☆</button></div></div>)}
      </div>
    </>
  )

  const challengesView = (
    <>
      <PageHeading title="Trading Challenges" subtitle="Complete challenges to earn skill points" />
      <div className="grid-2">
        <div>{data.assignments.filter((item) => item.studentIds.includes(user.id)).map((assignment) => { const done = assignment.completedIds.includes(user.id); return <div className="challenge-card" key={assignment.id}><div className="flex-between"><div><strong>{assignment.title}</strong><div className="text-sm text-gray">Due {assignment.dueDate}</div></div><Badge tone={assignment.difficulty === 'Hard' ? 'red' : assignment.difficulty === 'Medium' ? 'orange' : 'green'}>{assignment.difficulty}</Badge></div><p className="mt-8">{assignment.description}</p><div className="flex-between mt-16"><span className="text-bold text-orange">{assignment.skillPoints} skill points</span><button className={`btn btn-sm ${done ? 'btn-secondary' : 'btn-green'}`} disabled={done} onClick={() => { if (completeChallenge(user.id, assignment.id)) showToast('Challenge completed and points awarded.') }}>{done ? 'Completed' : 'Mark Complete'}</button></div></div> })}</div>
        <div className="card"><CardHeader title="Class Leaderboard" subtitle="Top performers in your class" />{data.users.filter((item) => item.role === 'learner' && item.instructorId === user.instructorId).sort((a, b) => b.portfolioValue - a.portfolioValue).map((learner, index) => <div className="leaderboard-row" key={learner.id}><span className={`rank-badge ${index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : ''}`}>{index + 1}</span><span><strong>{fullName(learner)}</strong><small>{learner.skillPoints} SP</small></span><strong>{fmtINR(learner.portfolioValue)}</strong></div>)}</div>
      </div>
    </>
  )

  const learningView = (
    <>
      <PageHeading title="My Learning" subtitle="Your enrolled courses and progress" />
      <div>{enrollments.map((enrollment) => { const course = data.courses.find((item) => item.id === enrollment.courseId); if (!course) return null; return <div className="course-row" key={enrollment.id}><div className="flex-between mb-8"><div><strong>{course.title}</strong><div className="text-sm text-gray">{course.category} · {course.duration}</div></div><StatusBadge status={enrollment.status} /></div><ProgressBar value={enrollment.progress} /><div className="flex-between mt-8"><span className="text-sm text-gray">{enrollment.progress}% complete</span><button className="btn btn-primary btn-sm" onClick={() => showToast(`Continuing ${course.title}.`, 'info')}>Continue</button></div></div>})}</div>
      <div className="card mt-24"><CardHeader title="Course Catalog" subtitle="Free, Pro and institution learning available to your account" />{data.courses.filter((course) => course.status === 'published' && !enrollments.some((item) => item.courseId === course.id)).map((course) => { const locked = course.accessTier === 'PRO' && user.subscriptionTier !== 'PRO'; return <div className="course-catalog-row" key={course.id}><div><strong>{course.title}</strong><div className="text-sm text-gray">{course.description}</div><div className="mt-8"><Badge tone={course.accessTier === 'PRO' ? 'orange' : 'blue'}>{course.accessTier}</Badge> <span className="rating-star">★ {course.rating}</span></div></div><button className={`btn btn-sm ${locked ? 'btn-orange' : 'btn-primary'}`} onClick={() => { if (locked) return setActiveTab('subscription'); if (enrollCourse(user.id, course.id)) showToast('Course enrolled successfully.') }}>{locked ? 'Upgrade to Pro' : 'Enroll'}</button></div>})}</div>
      <div className="card mt-24"><CardHeader title="Upcoming Sessions" subtitle="Scheduled trading classes" />{data.sessions.filter((item) => item.studentIds.includes(user.id) && item.status === 'scheduled').map((session) => <div className="session-card" key={session.id}><div><strong>{session.title}</strong><div className="text-sm text-gray">{session.date} · {session.time} · {session.duration} minutes</div></div><Badge tone="blue">{session.type}</Badge></div>)}</div>
    </>
  )

  const subscriptionView = (
    <>
      <PageHeading title="Plans & Subscription" subtitle={`Current plan: ${user.subscriptionTier || 'FREE'}`} />
      <div className="plans-grid">{data.subscriptionPlans.filter((plan) => plan.audience === 'B2C').map((plan) => { const current = (user.subscriptionTier || 'FREE') === plan.code && (plan.code === 'FREE' || plan.id.includes('monthly')); return <div className={`card plan-card ${plan.id === 'pro_annual' ? 'featured' : ''}`} key={plan.id}><div className="plan-name">{plan.name}</div><div className="plan-price">{fmtINR(plan.price)}<small> / {plan.billing}</small></div><ul>{plan.features.map((feature) => <li key={feature}>✓ {feature}</li>)}</ul><button className={`btn btn-block ${plan.code === 'PRO' ? 'btn-orange' : 'btn-secondary'}`} disabled={current} onClick={() => { choosePlan(user.id, plan.id); showToast(`${plan.name} activated in demo mode.`) }}>{current ? 'Current Plan' : plan.price ? 'Choose Plan' : 'Switch to Free'}</button></div>})}</div>
      {user.organizationId && <div className="card mt-24"><CardHeader title="Institution Access" subtitle="Your B2B workspace benefits" /><div className="alert alert-blue">{user.institution} provides private courses, assigned instructors, and institution learning analytics.</div></div>}
    </>
  )

  const notificationsView = (
    <>
      <PageHeading title="Notifications" subtitle="Assignments, sessions, achievements and feedback" action={<button className="btn btn-secondary btn-sm" onClick={() => markAllNotifications(user.id)}>Mark all read</button>} />
      <div className="card">{notifications.length ? notifications.map((item) => <button className={`notif-row react-notif-row ${item.read ? 'is-read' : ''}`} key={item.id} onClick={() => markNotification(item.id)}><span className={`notif-dot ${item.read ? 'gray-dot' : 'blue-dot'}`} /><span><strong>{item.message}</strong><small>{item.createdAt} · {item.type}</small></span>{!item.read && <Badge tone="blue">New</Badge>}</button>) : <EmptyState icon="○" title="No notifications" />}</div>
    </>
  )

  const views = {
    portfolio: portfolioView,
    watchlist: watchlistView,
    trading: tradingView,
    challenges: challengesView,
    learning: learningView,
    subscription: subscriptionView,
    notifications: notificationsView,
    settings: <ProfileSettings user={user} />,
  }

  return (
    <DashboardShell
      user={user}
      onNotifications={() => setActiveTab('notifications')}
      info={<><div className="nav-info orange-info"><span className="nav-info-label">Skill Points</span><span className="nav-info-value">{user.skillPoints}</span></div><button className="btn btn-secondary btn-sm nav-plan-btn" onClick={() => setActiveTab('subscription')}>{user.subscriptionTier || 'FREE'} Plan · Upgrade</button></>}
    >
      <MarketTicker stocks={data.stocks} onSelect={openStockFromTicker} />
      <main className="dashboard-content learner-dashboard">
        <div className="stat-grid">
          <StatCard label="Portfolio Value" value={fmtINR(user.portfolioValue)} sub="Virtual paper-trading account" />
          <StatCard label="Total Return" value={`${(((user.portfolioValue - 100000) / 1000)).toFixed(1)}%`} sub="From ₹1,00,000 baseline" tone="green" />
          <StatCard label="Skill Points" value={user.skillPoints} sub="Complete challenges to earn more" tone="orange" />
          <StatCard label="Courses" value={enrollments.length} sub={`${enrollments.filter((item) => item.status === 'completed').length} completed`} tone="blue" />
        </div>
        <TabBar tabs={tabs} activeTab={activeTab} onChange={(tab) => { setActiveTab(tab); if (!['watchlist', 'trading'].includes(tab)) setQuery('') }} />
        <section className="view-section active">{views[activeTab]}</section>
      </main>
    </DashboardShell>
  )
}
