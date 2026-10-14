export function initJobShareSeminar(root) {
  if (!root) return () => {}
  const buttons = [...root.querySelectorAll('[data-filter]')]
  const cards = [...root.querySelectorAll('.archive-card')]
  const groups = [...root.querySelectorAll('.archive-group')]
  const input = root.querySelector('#seminar-search')
  const form = root.querySelector('.archive-search')
  const countEl = root.querySelector('#result-count')
  const emptyEl = root.querySelector('#no-results')
  if (!input || !form || !countEl || !emptyEl) return () => {}

  let filter = 'all'
  const normalize = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .toLowerCase()

  function apply() {
    const keyword = normalize(input.value.trim())
    let count = 0
    for (const card of cards) {
      const show = (filter === 'all' || card.dataset.category === filter)
        && normalize(card.dataset.search).includes(keyword)
      card.hidden = !show
      if (show) count += 1
    }
    groups.forEach((group) => {
      group.hidden = ![...group.querySelectorAll('.archive-card')].some((card) => !card.hidden)
    })
    countEl.textContent = String(count)
    emptyEl.hidden = count !== 0
  }

  const onButton = (event) => {
    const button = event.currentTarget
    filter = button.dataset.filter || 'all'
    buttons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)))
    apply()
  }
  const onSubmit = (event) => {
    event.preventDefault()
    apply()
  }
  const onInput = () => apply()
  const onIndex = () => {
    filter = 'all'
    input.value = ''
    buttons.forEach((item) => item.setAttribute('aria-pressed', String(item.dataset.filter === 'all')))
    apply()
  }

  buttons.forEach((button) => button.addEventListener('click', onButton))
  form.addEventListener('submit', onSubmit)
  input.addEventListener('input', onInput)
  const indexLinks = [...root.querySelectorAll('.seminar-index a')]
  indexLinks.forEach((link) => link.addEventListener('click', onIndex))

  return () => {
    buttons.forEach((button) => button.removeEventListener('click', onButton))
    form.removeEventListener('submit', onSubmit)
    input.removeEventListener('input', onInput)
    indexLinks.forEach((link) => link.removeEventListener('click', onIndex))
  }
}
