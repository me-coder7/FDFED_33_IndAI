import { useMemo, useState } from 'react'
import DashboardShell from '../components/DashboardShell.jsx'
import {
  Badge, CardHeader, EmptyState, Field, PageHeading, StatCard, StatusBadge, TabBar,
} from '../components/UI.jsx'
import { useData } from '../context/DataContext.jsx'
import { useOverlay } from '../context/OverlayContext.jsx'
import {
  averageLearnerReturn, fmtINR, fullName, getInstructors, getLearners, getProviders, getUser,
} from '../utils/selectors.js'
import { email, minLength, required, validateFields, wholeNumber } from '../utils/validation.js'

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: '▦' },
  { id: 'users', label: 'User Management', icon: '♙' },
  { id: 'assignments', label: 'Assignments', icon: '▤' },
  { id: 'commercial', label: 'Institutions & Mapping', icon: '◇' },
]

function UserForm({ users, instructors, editing }) {
  const [form, setForm] = useState(editing ? {
    firstName: editing.firstName, lastName: editing.lastName, email: editing.email,
    role: editing.role, status: editing.status, tradingLimit: editing.tradingLimit || 0,
    instructorId: editing.instructorId || '', password: editing.password || 'Learn@1234',
  } : { firstName: '', lastName: '', email: '', role: 'learner', status: 'active', tradingLimit: 100000, instructorId: '', password: 'Learn@1234' })
  const [errors, setErrors] = useState({})
  const { addUser, updateUser } = useData()
  const { closeModal, showToast } = useOverlay()
  const change = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const submit = (event) => {
    event.preventDefault()
    const nextErrors = validateFields({
      firstName: [() => minLength(form.firstName, 'First name', 2)],
      lastName: [() => minLength(form.lastName, 'Last name', 2)],
      email: [() => email(form.email)],
      password: [() => minLength(form.password, 'Password', 8)],
      tradingLimit: [() => form.role === 'learner' ? wholeNumber(form.tradingLimit, 'Trading limit', 1000, 10000000) : ''],
    })
    if (!editing && users.some((item) => item.email.toLowerCase() === form.email.toLowerCase())) nextErrors.email = 'This email already exists.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    const payload = { ...form, tradingLimit: Number(form.tradingLimit) }
    if (editing) updateUser(editing.id, payload)
    else addUser(payload)
    closeModal(); showToast(editing ? 'User updated.' : 'User created.')
  }
  return <form onSubmit={submit}><div className="modal-title">{editing ? 'Edit User' : 'Add Platform User'}</div><div className="modal-subtitle">React-controlled administration form with shared validation.</div><div className="form-row"><Field label="First Name" error={errors.firstName}><input className="form-input" value={form.firstName} onChange={(event) => change('firstName', event.target.value)} /></Field><Field label="Last Name" error={errors.lastName}><input className="form-input" value={form.lastName} onChange={(event) => change('lastName', event.target.value)} /></Field></div><Field label="Email" error={errors.email}><input className="form-input" type="email" value={form.email} onChange={(event) => change('email', event.target.value)} /></Field><div className="form-row"><Field label="Role"><select className="form-select" value={form.role} disabled={Boolean(editing)} onChange={(event) => change('role', event.target.value)}><option value="learner">Learner</option><option value="instructor">Instructor</option></select></Field><Field label="Status"><select className="form-select" value={form.status} onChange={(event) => change('status', event.target.value)}><option value="active">Active</option><option value="suspended">Suspended</option></select></Field></div>{form.role === 'learner' && <><Field label="Assigned Instructor"><select className="form-select" value={form.instructorId} onChange={(event) => change('instructorId', event.target.value)}><option value="">Unassigned</option>{instructors.map((instructor) => <option key={instructor.id} value={instructor.id}>{fullName(instructor)}</option>)}</select></Field><Field label="Trading Limit" error={errors.tradingLimit}><input className="form-input" type="number" value={form.tradingLimit} onChange={(event) => change('tradingLimit', event.target.value)} /></Field></>}<Field label="Temporary Password" error={errors.password}><input className="form-input" value={form.password} onChange={(event) => change('password', event.target.value)} /></Field><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button><button className="btn btn-purple">{editing ? 'Save Changes' : 'Create User'}</button></div></form>
}

function InstitutionForm() {
  const [form, setForm] = useState({ name: '', code: '', billingEmail: '', seats: 500, annualPrice: 150000, perStudentFee: 200 })
  const [errors, setErrors] = useState({})
  const { addOrganization } = useData()
  const { closeModal, showToast } = useOverlay()
  const change = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const submit = (event) => {
    event.preventDefault()
    const nextErrors = validateFields({ name: [() => minLength(form.name, 'Institution name', 3)], code: [() => minLength(form.code, 'Code', 2)], billingEmail: [() => email(form.billingEmail, 'billing email')], seats: [() => wholeNumber(form.seats, 'Licensed seats', 1, 100000)] })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    addOrganization({ ...form, seats: Number(form.seats), annualPrice: Number(form.annualPrice), perStudentFee: Number(form.perStudentFee) })
    closeModal(); showToast('Institution workspace created.')
  }
  return <form onSubmit={submit}><div className="modal-title">Add B2B Institution</div><div className="modal-subtitle">Create a private workspace. Payment Admin controls license activation.</div><div className="form-row"><Field label="Institution Name" error={errors.name}><input className="form-input" value={form.name} onChange={(event) => change('name', event.target.value)} /></Field><Field label="Code" error={errors.code}><input className="form-input" value={form.code} onChange={(event) => change('code', event.target.value.toUpperCase())} /></Field></div><Field label="Billing Email" error={errors.billingEmail}><input className="form-input" type="email" value={form.billingEmail} onChange={(event) => change('billingEmail', event.target.value)} /></Field><div className="form-row"><Field label="Licensed Seats" error={errors.seats}><input className="form-input" type="number" value={form.seats} onChange={(event) => change('seats', event.target.value)} /></Field><Field label="Annual License (₹)"><input className="form-input" type="number" value={form.annualPrice} onChange={(event) => change('annualPrice', event.target.value)} /></Field></div><Field label="Per Student Fee (₹)"><input className="form-input" type="number" value={form.perStudentFee} onChange={(event) => change('perStudentFee', event.target.value)} /></Field><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button><button className="btn btn-purple">Create Institution</button></div></form>
}

function AdminAssignmentForm({ instructors, learners }) {
  const [form, setForm] = useState({ title: '', description: '', dueDate: '', difficulty: 'Medium', skillPoints: 40, instructorId: instructors[0]?.id || '' })
  const [error, setError] = useState('')
  const { addAssignment } = useData()
  const { closeModal, showToast } = useOverlay()
  const submit = (event) => {
    event.preventDefault()
    const message = minLength(form.title, 'Title', 3) || minLength(form.description, 'Description', 8) || required(form.dueDate, 'Due date')
    if (message) return setError(message)
    const studentIds = learners.filter((learner) => learner.instructorId === form.instructorId).map((learner) => learner.id)
    addAssignment({ ...form, skillPoints: Number(form.skillPoints), studentIds })
    closeModal(); showToast('Admin assignment created.')
  }
  return <form onSubmit={submit}><div className="modal-title">Create Assignment</div><div className="modal-subtitle">Create a class assignment under an instructor.</div><Field label="Title" error={error}><input className="form-input" value={form.title} onChange={(event) => { setForm({ ...form, title: event.target.value }); setError('') }} /></Field><Field label="Description"><textarea className="form-textarea" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Field><Field label="Instructor"><select className="form-select" value={form.instructorId} onChange={(event) => setForm({ ...form, instructorId: event.target.value })}>{instructors.map((instructor) => <option key={instructor.id} value={instructor.id}>{fullName(instructor)}</option>)}</select></Field><div className="form-row"><Field label="Due Date"><input className="form-input" type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} /></Field><Field label="Skill Points"><input className="form-input" type="number" value={form.skillPoints} onChange={(event) => setForm({ ...form, skillPoints: event.target.value })} /></Field></div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button><button className="btn btn-purple">Create Assignment</button></div></form>
}

export default function UserAdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [userType, setUserType] = useState('students')
  const [query, setQuery] = useState('')
  const [mapLearner, setMapLearner] = useState('')
  const [mapInstructorId, setMapInstructorId] = useState('')
  const { data, deleteUser, mapInstructor, toggleProviderVerification } = useData()
  const { openModal, closeModal, showToast } = useOverlay()
  const user = getUser(data, 'u2')
  const learners = getLearners(data)
  const instructors = getInstructors(data)
  const providers = getProviders(data)
  const avgReturn = averageLearnerReturn(data, learners)
  const filteredUsers = (userType === 'students' ? learners : instructors).filter((item) => `${fullName(item)} ${item.email}`.toLowerCase().includes(query.toLowerCase()))
  const activeLearners = learners.filter((item) => item.status === 'active').length
  const publishedCourses = data.courses.filter((item) => item.status === 'published').length

  const notifications = () => {
    const items = data.notifications.filter((item) => item.userId === user.id)
    openModal(<><div className="modal-title">User Admin Notifications</div>{items.length ? items.map((item) => <div className="notif-row" key={item.id}><span className="notif-dot blue-dot" /><span><strong>{item.message}</strong><small>{item.createdAt}</small></span></div>) : <EmptyState title="No notifications" />}<div className="modal-footer"><button className="btn btn-primary" onClick={closeModal}>Close</button></div></>)
  }

  const dashboardView = <><div className="grid-2"><div className="card"><CardHeader title="System Health Monitor" subtitle="Operational services" />{[['Authentication Service', 'green', 'Operational'], ['User Data Store', 'blue', 'Synchronized'], ['Notification Queue', 'purple', 'Operational']].map(([title, tone, status]) => <div className={`health-item ${tone}`} key={title}><div className="health-item-left"><div className={`health-icon ${tone}`}>●</div><div><div className="health-title">{title}</div><div className="health-sub">Last checked just now</div></div></div><Badge tone="green">{status}</Badge></div>)}</div><div className="card"><CardHeader title="Recent System Activity" subtitle="Latest administrative changes" />{[{ msg: 'Provider verification queue reviewed', sub: `${providers.filter((item) => !item.providerVerified).length} pending providers` }, { msg: 'Institution membership synchronized', sub: `${data.organizations.length} B2B workspaces` }, { msg: 'Learner-to-instructor mapping active', sub: `${learners.filter((item) => item.instructorId).length} mapped learners` }].map((item, index) => <div className="activity-item" key={item.msg}><span className="activity-dot" style={{ background: ['var(--purple)', 'var(--green)', 'var(--blue)'][index] }} /><div><strong>{item.msg}</strong><div className="text-sm text-gray">{item.sub}</div></div></div>)}</div></div><div className="card mt-24"><CardHeader title="User Growth Overview" subtitle="Current platform population" /><div className="course-metric-grid four"><div><strong>{learners.length}</strong><span>Total Learners</span></div><div><strong>{activeLearners}</strong><span>Active Learners</span></div><div><strong>{instructors.length}</strong><span>Instructors</span></div><div><strong>{providers.length}</strong><span>Providers</span></div></div></div><div className="card mt-24"><CardHeader title="Platform Analytics Report" /><div className="analytics-grid"><div className="analytics-card"><div className="ac-value text-blue">{data.trades.length}</div><div className="ac-label">Simulated Trades</div></div><div className="analytics-card"><div className="ac-value positive">+{avgReturn.toFixed(1)}%</div><div className="ac-label">Average Learner Return</div></div><div className="analytics-card"><div className="ac-value text-orange">{publishedCourses}</div><div className="ac-label">Published Courses</div></div></div></div></>

  const usersView = <><PageHeading title="Student Management" subtitle="Manage learners, instructors, limits, and account status" action={<button className="btn btn-purple" onClick={() => openModal(<UserForm users={data.users} instructors={instructors} />)}>+ Add User</button>} /><div className="sub-tab-row"><button className={`btn btn-sm ${userType === 'students' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setUserType('students')}>Learners</button><button className={`btn btn-sm ${userType === 'instructors' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setUserType('instructors')}>Instructors</button><input className="form-input compact-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search users..." /></div><div className="card"><div className="table-wrap"><table><thead><tr><th>Name / Status</th><th>Email</th>{userType === 'students' && <><th>Instructor</th><th>Skill Points</th><th>Trading Limit</th></>} {userType === 'instructors' && <th>Assigned Students</th>}<th>Actions</th></tr></thead><tbody>{filteredUsers.map((item) => { const protectedDemo = ['u3', 'u6'].includes(item.id); return <tr key={item.id}><td><strong>{fullName(item)}</strong><div><StatusBadge status={item.status} /></div></td><td>{item.email}</td>{userType === 'students' && <><td>{fullName(getUser(data, item.instructorId))}</td><td className="text-orange text-bold">{item.skillPoints}</td><td>{fmtINR(item.tradingLimit)}</td></>}{userType === 'instructors' && <td>{(item.studentIds || []).length}</td>}<td><div className="row-actions"><button className="btn btn-secondary btn-sm" onClick={() => openModal(<UserForm users={data.users} instructors={instructors} editing={item} />)}>Edit</button><button className="btn btn-danger btn-sm" disabled={protectedDemo} title={protectedDemo ? 'Protected because this account powers an actor demo page' : 'Delete user'} onClick={() => { if (window.confirm(`Delete ${fullName(item)}?`) && deleteUser(item.id)) showToast('User deleted.', 'info') }}>Delete</button></div></td></tr> })}</tbody></table></div></div></>

  const assignmentsView = <><PageHeading title="Assignments Management" subtitle="Create and monitor instructor-led trading assignments" action={<button className="btn btn-purple" onClick={() => openModal(<AdminAssignmentForm instructors={instructors} learners={learners} />)}>+ Add Assignment</button>} />{data.assignments.map((assignment) => <div className="assignment-card" key={assignment.id}><div className="flex-between"><div><strong>{assignment.title}</strong><p>{assignment.description}</p></div><StatusBadge status={assignment.status} /></div><div className="flex-between mt-16"><span className="text-sm text-gray">Instructor: {fullName(getUser(data, assignment.instructorId))} · Due {assignment.dueDate}</span><span>{assignment.completedIds.length}/{assignment.studentIds.length} complete · {assignment.skillPoints} SP</span></div></div>)}</>

  const commercialView = <><PageHeading title="Institution & User Administration" subtitle="Manage B2B institutions, memberships, learner mapping, and provider verification" action={<button className="btn btn-purple" onClick={() => openModal(<InstitutionForm />)}>+ Add Institution</button>} /><div className="grid-2"><div className="card"><CardHeader title="B2B Institution Accounts" subtitle="Private institution workspaces" />{data.organizations.map((organization) => { const members = data.users.filter((item) => item.organizationId === organization.id); return <div className="holding-row" key={organization.id}><div><strong>{organization.name}</strong><div className="text-sm text-gray">{organization.code || organization.id} · {members.length} members · {organization.seats} seats</div></div><StatusBadge status={organization.licenseStatus || organization.status} /></div> })}</div><div className="card"><CardHeader title="Instructor Mapping" subtitle="Assign or reassign learners" /><Field label="Learner"><select className="form-select" value={mapLearner} onChange={(event) => setMapLearner(event.target.value)}><option value="">Select learner</option>{learners.map((learner) => <option key={learner.id} value={learner.id}>{fullName(learner)} — {learner.institution || 'Independent'}</option>)}</select></Field><Field label="Instructor"><select className="form-select" value={mapInstructorId} onChange={(event) => setMapInstructorId(event.target.value)}><option value="">Select instructor</option>{instructors.map((instructor) => <option key={instructor.id} value={instructor.id}>{fullName(instructor)} — {instructor.institution || 'Platform'}</option>)}</select></Field><button className="btn btn-purple btn-block" onClick={() => { if (!mapLearner || !mapInstructorId) return showToast('Select both a learner and instructor.', 'error'); mapInstructor(mapLearner, mapInstructorId); showToast('Instructor mapping saved.') }}>Map Instructor to Learner</button><div className="alert alert-blue mt-16">Institution users should be mapped to an instructor in the same workspace.</div></div></div><div className="card mt-24"><CardHeader title="Current Learner Mapping" subtitle="Operational view for User Admin" /><div className="table-wrap"><table><thead><tr><th>Learner</th><th>Institution</th><th>Subscription</th><th>Instructor</th></tr></thead><tbody>{learners.map((learner) => <tr key={learner.id}><td><strong>{fullName(learner)}</strong></td><td>{learner.institution || 'Independent'}</td><td><Badge tone={learner.subscriptionTier === 'PRO' ? 'orange' : 'gray'}>{learner.subscriptionTier || 'FREE'}</Badge></td><td>{fullName(getUser(data, learner.instructorId))}</td></tr>)}</tbody></table></div></div><div className="card mt-24"><CardHeader title="Course Provider Verification" subtitle="Verify identity before commercial course submission" /><div className="table-wrap"><table><thead><tr><th>Provider</th><th>Organization</th><th>Status</th><th>Verification</th><th>Action</th></tr></thead><tbody>{providers.map((provider) => <tr key={provider.id}><td><strong>{fullName(provider)}</strong><div className="text-sm text-gray">{provider.email}</div></td><td>{provider.organization || provider.institution || '—'}</td><td><StatusBadge status={provider.status} /></td><td><Badge tone={provider.providerVerified ? 'green' : 'orange'}>{provider.providerVerified ? 'VERIFIED' : 'NOT VERIFIED'}</Badge></td><td><button className={`btn btn-sm ${provider.providerVerified ? 'btn-secondary' : 'btn-purple'}`} onClick={() => { toggleProviderVerification(provider.id); showToast(provider.providerVerified ? 'Verification revoked.' : 'Provider verified.', 'info') }}>{provider.providerVerified ? 'Revoke' : 'Verify'}</button></td></tr>)}</tbody></table></div></div></>

  const views = { dashboard: dashboardView, users: usersView, assignments: assignmentsView, commercial: commercialView }

  return <DashboardShell user={user} admin onNotifications={notifications} info={<div className="nav-info purple-info"><span className="nav-info-label">Team</span><span className="nav-info-value">USER ADMIN</span></div>}><main className="dashboard-content admin-dashboard"><div className="stat-grid"><StatCard label="Learners" value={learners.length} sub={`${activeLearners} active users`} /><StatCard label="Instructors" value={instructors.length} sub="Instructor mapping & support" tone="green" /><StatCard label="Institutions" value={data.organizations.length} sub="B2B workspaces" tone="purple" /><StatCard label="Provider Verification" value={providers.filter((item) => !item.providerVerified).length} sub="Awaiting verification" tone="orange" /></div><TabBar tabs={tabs} activeTab={activeTab} onChange={setActiveTab} /><section className="view-section active">{views[activeTab]}</section></main></DashboardShell>
}
