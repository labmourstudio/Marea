export const positiveAmount = (value) => {
  const amount = Number(value)
  return Number.isSafeInteger(amount) && amount >= 0 ? amount : 0
}

export const matchesToEarn = (cost, reward) => {
  const price = positiveAmount(cost)
  const perMatch = positiveAmount(reward)
  return perMatch > 0 ? Math.ceil(price / perMatch) : null
}

export const budgetTotal = (skins) => skins.reduce((sum, skin) => sum + positiveAmount(skin.content?.productionCost), 0)

export const gameEntries = (sections, category) => sections.filter((section) => section.section_type === 'custom' && section.content?.category === category)
