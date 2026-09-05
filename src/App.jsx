import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const categories = {
  Food: { color: '#E87945', soft: '#F9DFD0', icon: '●' },
  Transport: { color: '#5E92A7', soft: '#D9E9ED', icon: '◆' },
  Shopping: { color: '#D96868', soft: '#F5DADA', icon: '■' },
}

const dotPositions = [
  [21, 30], [52, 22], [76, 38], [36, 57], [66, 68], [18, 77],
  [86, 75], [48, 84], [10, 50], [89, 17], [63, 45], [32, 14],
]

const storageKey = 'spendary.expenses'

function loadExpenses() {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) ?? '[]')
    if (!Array.isArray(stored)) return []

    return stored.filter((expense) => (
      typeof expense?.id === 'string'
      && Number.isFinite(expense.amount)
      && expense.amount > 0
      && expense.category in categories
      && typeof expense.note === 'string'
    ))
  } catch {
    return []
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

function App() {
  const [expenses, setExpenses] = useState(loadExpenses)
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
    try {
      localStorage.setItem(storageKey, JSON.stringify(expenses))
    } catch {
      // Keep the app usable if browser storage is unavailable.
    }
  }, [expenses])

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

  const addExpense = (event) => {
    event.preventDefault()
    const value = Number.parseFloat(amount)
    if (!Number.isFinite(value) || value <= 0) return

    const expense = {
      id: crypto.randomUUID(),
      amount: Math.round(value * 100) / 100,
      category,
      note: note.trim(),
      createdAt: new Date(),
    }
    setExpenses((current) => [...current, expense])
    closeSheet()
  }

  const removeExpense = (id) => {
    setExpenses((current) => current.filter((expense) => expense.id !== id))
    setSelectedId(null)
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a href="#top" className="brand" aria-label="Spendary 首页">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          Spendary
        </a>
        <span className="date-pill" aria-label={`今天，${today}`}>
          <span className="date-dot" /> 今天 · {today}
        </span>
      </header>

      <div className="content-grid" id="top">
        <section className="summary-panel" aria-labelledby="today-title">
          <div className="eyebrow"><span /> 今日消费</div>
          <div className="amount-heading">
            <span className="currency-sign">¥</span>
            <h1 id="today-title">{total.toFixed(2)}</h1>
          </div>
          <p className="summary-copy">
            {expenses.length === 0
              ? '从第一颗消费圆点开始，记录今天。'
              : `今天已记录 ${expenses.length} 笔消费。`}
          </p>

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
                <button type="button" onClick={() => removeExpense(selectedExpense.id)}>删除这笔</button>
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

              <button type="submit" className="save-button" disabled={!amount || Number(amount) <= 0}>
                保存到今日地图
                <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m7 4 6 6-6 6" /></svg>
              </button>
            </form>
          </section>
        </div>
      )}
    </main>
  )
}

export default App
