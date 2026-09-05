import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { supabase } from './supabase'

const categories = {
  Food: { color: '#E87945', soft: '#F9DFD0', icon: '●' },
  Transport: { color: '#5E92A7', soft: '#D9E9ED', icon: '◆' },
  Shopping: { color: '#D96868', soft: '#F5DADA', icon: '■' },
}

const dotPositions = [
  [21, 30], [52, 22], [76, 38], [36, 57], [66, 68], [18, 77],
  [86, 75], [48, 84], [10, 50], [89, 17], [63, 45], [32, 14],
]

const expenseColumns = 'id, amount, category, note, created_at'

function expenseFromRow(row) {
  return {
    id: row.id,
    amount: Number(row.amount),
    category: row.category,
    note: row.note,
    createdAt: row.created_at,
  }
}

const currency = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
  minimumFractionDigits: 2,
})

function CategoryIcon({ category }) {
  const paths = {
    Food: <><path d="M8 3v6M11 3v6M8 6h3M9.5 9v8M15 3v14M15 3c2.1 1.8 2.1 6 0 7" /></>,
    Transport: <><rect x="4" y="5" width="12" height="9" rx="2" /><path d="M6.5 14v2M13.5 14v2M4 10h12M7 7h6" /></>,
    Shopping: <><path d="M5 7h10l1 10H4L5 7Z" /><path d="M7.5 8V6a2.5 2.5 0 0 1 5 0v2" /></>,
  }

  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="category-icon">
      {paths[category]}
    </svg>
  )
}

function Brand() {
  return (
    <span className="brand-lockup">
      <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
      Spendary
    </span>
  )
}

function AuthScreen() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isSignup = mode === 'signup'

  const switchMode = (nextMode) => {
    setMode(nextMode)
    setPassword('')
    setConfirmPassword('')
    setMessage(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage(null)

    if (isSignup && password !== confirmPassword) {
      setMessage({ type: 'error', text: '两次输入的密码不一致。' })
      return
    }

    setIsSubmitting(true)

    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error

        if (data.session) {
          setMessage({ type: 'success', text: '账号创建成功，正在进入 Spendary…' })
        } else {
          setMessage({ type: 'success', text: '账号已创建。请查看邮箱并确认后登录。' })
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || '操作失败，请稍后重试。' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-intro" aria-labelledby="auth-title">
        <a href="./" className="auth-brand" aria-label="Spendary 首页"><Brand /></a>
        <div className="auth-map" aria-hidden="true">
          <span className="auth-orbit auth-orbit-one" />
          <span className="auth-orbit auth-orbit-two" />
          <i className="auth-dot auth-dot-one" />
          <i className="auth-dot auth-dot-two" />
          <i className="auth-dot auth-dot-three" />
          <i className="auth-dot auth-dot-four" />
        </div>
        <div className="auth-copy">
          <span className="section-kicker">YOUR DAILY SPEND MAP</span>
          <h1 id="auth-title">看见每一笔消费，<br />也看见今天。</h1>
          <p>把消费变成圆点，让一天的选择慢慢浮现。</p>
        </div>
      </section>

      <section className="auth-panel" aria-labelledby="form-title">
        <div className="auth-card">
          <div className="auth-tabs" aria-label="账号操作">
            <button type="button" className={!isSignup ? 'is-active' : ''} onClick={() => switchMode('login')}>登录</button>
            <button type="button" className={isSignup ? 'is-active' : ''} onClick={() => switchMode('signup')}>创建账号</button>
          </div>

          <div className="auth-heading">
            <span className="eyebrow"><span /> {isSignup ? '从今天开始' : '欢迎回来'}</span>
            <h2 id="form-title">{isSignup ? '创建 Spendary 账号' : '登录 Spendary'}</h2>
            <p>{isSignup ? '只需邮箱和密码，即可开始记录。' : '继续查看你的今日消费地图。'}</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              <span>邮箱</span>
              <input type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
            <label>
              <span>密码</span>
              <input type="password" autoComplete={isSignup ? 'new-password' : 'current-password'} placeholder="至少 6 位" minLength="6" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </label>
            {isSignup && (
              <label>
                <span>再次输入密码</span>
                <input type="password" autoComplete="new-password" placeholder="再次输入密码" minLength="6" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
              </label>
            )}

            {message && <p className={`auth-message is-${message.type}`} role="status">{message.text}</p>}

            <button type="submit" className="auth-submit" disabled={isSubmitting}>
              {isSubmitting ? '请稍候…' : isSignup ? '创建账号' : '登录'}
              {!isSubmitting && <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m7 4 6 6-6 6" /></svg>}
            </button>
          </form>

          <p className="auth-switch">
            {isSignup ? '已经有账号？' : '还没有账号？'}
            <button type="button" onClick={() => switchMode(isSignup ? 'login' : 'signup')}>{isSignup ? '直接登录' : '创建一个'}</button>
          </p>
        </div>
      </section>
    </main>
  )
}

function SpendaryDashboard({ user, onSignOut, isSigningOut }) {
  const [expenses, setExpenses] = useState([])
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [dataError, setDataError] = useState('')
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Food')
  const [note, setNote] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const amountInputRef = useRef(null)

  const total = useMemo(
    () => expenses.reduce((sum, expense) => sum + expense.amount, 0),
    [expenses],
  )

  const today = new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date())

  const selectedExpense = expenses.find((expense) => expense.id === selectedId)

  useEffect(() => {
    let ignore = false

    const loadCloudExpenses = async () => {
      setIsLoadingExpenses(true)
      setDataError('')

      const { data, error } = await supabase
        .from('expenses')
        .select(expenseColumns)
        .order('created_at', { ascending: true })

      if (ignore) return

      if (error) {
        setDataError('暂时无法读取消费记录，请稍后重试。')
      } else {
        setExpenses(data.map(expenseFromRow))
      }
      setIsLoadingExpenses(false)
    }

    loadCloudExpenses()
    return () => { ignore = true }
  }, [user.id])

  useEffect(() => {
    if (isSheetOpen) {
      window.setTimeout(() => amountInputRef.current?.focus(), 120)
    }
  }, [isSheetOpen])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsSheetOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const openSheet = () => {
    setSelectedId(null)
    setIsSheetOpen(true)
  }

  const closeSheet = () => {
    setIsSheetOpen(false)
    setAmount('')
    setNote('')
    setCategory('Food')
  }

  const addExpense = async (event) => {
    event.preventDefault()
    const value = Number.parseFloat(amount)
    if (!Number.isFinite(value) || value <= 0) return

    setIsSaving(true)
    setDataError('')

    const { data, error } = await supabase
      .from('expenses')
      .insert({
      amount: Math.round(value * 100) / 100,
      category,
      note: note.trim(),
      })
      .select(expenseColumns)
      .single()

    setIsSaving(false)

    if (error) {
      setDataError('保存失败，请检查网络后重试。')
      return
    }

    setExpenses((current) => [...current, expenseFromRow(data)])
    closeSheet()
  }

  const removeExpense = async (id) => {
    setDeletingId(id)
    setDataError('')

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)

    setDeletingId(null)

    if (error) {
      setDataError('删除失败，请稍后重试。')
      return
    }

    setExpenses((current) => current.filter((expense) => expense.id !== id))
    setSelectedId(null)
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a href="#top" className="brand" aria-label="Spendary 首页">
          <Brand />
        </a>
        <div className="account-controls">
          <span className="date-pill" aria-label={`今天，${today}`}><span className="date-dot" /> 今天 · {today}</span>
          <span className="account-email" title={user.email}>{user.email}</span>
          <button type="button" className="signout-button" onClick={onSignOut} disabled={isSigningOut}>
            {isSigningOut ? '退出中…' : '退出'}
          </button>
        </div>
      </header>

      <div className="content-grid" id="top">
        <section className="summary-panel" aria-labelledby="today-title">
          <div className="eyebrow"><span /> 今日消费</div>
          <div className="amount-heading">
            <span className="currency-sign">¥</span>
            <h1 id="today-title">{total.toFixed(2)}</h1>
          </div>
          <p className="summary-copy">
            {isLoadingExpenses
              ? '正在读取你的消费记录…'
              : expenses.length === 0
              ? '从第一颗消费圆点开始，记录今天。'
              : `今天已记录 ${expenses.length} 笔消费。`}
          </p>
          {dataError && <p className="data-error" role="alert">{dataError}</p>}

          <div className="category-summary" aria-label="消费分类">
            {Object.entries(categories).map(([name, config]) => {
              const categoryTotal = expenses
                .filter((expense) => expense.category === name)
                .reduce((sum, expense) => sum + expense.amount, 0)
              return (
                <div className="category-row" key={name}>
                  <span className="legend-dot" style={{ background: config.color }} />
                  <span>{name}</span>
                  <strong>{currency.format(categoryTotal)}</strong>
                </div>
              )
            })}
          </div>
        </section>

        <section className="map-card" aria-labelledby="map-title">
          <div className="map-heading">
            <div>
              <span className="section-kicker">DAILY MAP</span>
              <h2 id="map-title">今天的消费地图</h2>
            </div>
            <span className="count-badge">{expenses.length} 颗圆点</span>
          </div>

          <div className={`expense-map ${expenses.length === 0 ? 'is-empty' : ''}`}>
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            {expenses.length === 0 ? (
              <div className="empty-state">
                <div className="empty-dots" aria-hidden="true"><i /><i /><i /></div>
                <h3>这里还很安静</h3>
                <p>记下一笔消费，它会成为地图上的第一颗圆点。</p>
                <button type="button" onClick={openSheet}>添加第一笔</button>
              </div>
            ) : (
              expenses.map((expense, index) => {
                const [x, y] = dotPositions[index % dotPositions.length]
                const size = Math.min(68, 32 + Math.sqrt(expense.amount) * 2.4)
                return (
                  <button
                    type="button"
                    className={`expense-dot ${selectedId === expense.id ? 'is-selected' : ''}`}
                    key={expense.id}
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      width: size,
                      height: size,
                      background: categories[expense.category].color,
                      '--dot-soft': categories[expense.category].soft,
                    }}
                    onClick={() => setSelectedId(selectedId === expense.id ? null : expense.id)}
                    aria-label={`${expense.category}，${currency.format(expense.amount)}`}
                  >
                    <CategoryIcon category={expense.category} />
                  </button>
                )
              })
            )}

            {selectedExpense && (
              <aside className="expense-detail" aria-live="polite">
                <div className="detail-label">
                  <span style={{ background: categories[selectedExpense.category].color }} />
                  {selectedExpense.category}
                </div>
                <strong>{currency.format(selectedExpense.amount)}</strong>
                {selectedExpense.note && <p>{selectedExpense.note}</p>}
                <button type="button" onClick={() => removeExpense(selectedExpense.id)} disabled={deletingId === selectedExpense.id}>
                  {deletingId === selectedExpense.id ? '删除中…' : '删除这笔'}
                </button>
              </aside>
            )}
          </div>

          <div className="map-legend">
            <span>圆点越大，金额越高</span>
            <span className="map-legend-key"><i /><i /><i /> 仅限今天</span>
          </div>
        </section>
      </div>

      <button type="button" className="floating-add" onClick={openSheet} aria-label="添加消费">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
        <span>添加消费</span>
      </button>

      {isSheetOpen && (
        <div className="sheet-layer" role="presentation">
          <button type="button" className="sheet-backdrop" onClick={closeSheet} aria-label="关闭添加表单" />
          <section className="bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
            <div className="sheet-handle" />
            <div className="sheet-header">
              <div>
                <span className="section-kicker">NEW ENTRY</span>
                <h2 id="sheet-title">添加一笔消费</h2>
              </div>
              <button type="button" className="close-button" onClick={closeSheet} aria-label="关闭">×</button>
            </div>

            <form onSubmit={addExpense}>
              <label className="amount-field">
                <span>金额</span>
                <div><b>¥</b><input ref={amountInputRef} type="number" inputMode="decimal" min="0.01" step="0.01" placeholder="0.00" value={amount} onChange={(event) => setAmount(event.target.value)} required /></div>
              </label>

              <fieldset>
                <legend>分类</legend>
                <div className="category-options">
                  {Object.entries(categories).map(([name, config]) => (
                    <label className={category === name ? 'is-active' : ''} key={name} style={{ '--category-color': config.color, '--category-soft': config.soft }}>
                      <input type="radio" name="category" value={name} checked={category === name} onChange={() => setCategory(name)} />
                      <span className="option-icon"><CategoryIcon category={name} /></span>
                      {name}
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="note-field">
                <span>备注 <small>选填</small></span>
                <input type="text" maxLength="40" placeholder="例如：午餐" value={note} onChange={(event) => setNote(event.target.value)} />
              </label>

              <button type="submit" className="save-button" disabled={isSaving || !amount || Number(amount) <= 0}>
                {isSaving ? '保存中…' : '保存到今日地图'}
                <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m7 4 6 6-6 6" /></svg>
              </button>
            </form>
          </section>
        </div>
      )}
    </main>
  )
}

function App() {
  const [session, setSession] = useState(null)
  const [isAuthReady, setIsAuthReady] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setIsAuthReady(true)
    })

    supabase.auth.getSession().then(({ data: sessionData }) => {
      setSession(sessionData.session)
      setIsAuthReady(true)
    })

    return () => data.subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    setIsSigningOut(true)
    await supabase.auth.signOut()
    setIsSigningOut(false)
  }

  if (!isAuthReady) {
    return (
      <main className="auth-loading" aria-live="polite">
        <Brand />
        <span>正在恢复会话…</span>
      </main>
    )
  }

  return session
    ? <SpendaryDashboard user={session.user} onSignOut={handleSignOut} isSigningOut={isSigningOut} />
    : <AuthScreen />
}

export default App
