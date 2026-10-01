export const sessionPackages = [
  { id: 'focus', name: 'Focused review', minutes: 60, duration: '1 hour', price: 10000, hourlyPrice: 10000, description: 'One CV, one project, or one question to work through.' },
  { id: 'workshop', name: 'Review + work together', minutes: 90, duration: '1 hour 30 minutes', price: 13500, hourlyPrice: 15000, description: 'Review your work, then make useful changes together.' },
  { id: 'deep-dive', name: 'More time to build', minutes: 120, duration: '2 hours', price: 17000, hourlyPrice: 20000, description: 'A longer project walkthrough or time to work through a tricky problem.' },
]

export function resolveSession(input) {
  const option = sessionPackages.find((item) => item.id === input.packageId)
  if (option) return option
  // Existing links already sent by email keep the price they promised.
  if (input.packageId === undefined && (input.hours === 1 || input.hours === 2)) {
    return { id: `legacy-${input.hours}`, name: 'Session', minutes: input.hours * 60, duration: `${input.hours} ${input.hours === 1 ? 'hour' : 'hours'}`, price: input.hours * 10000, hourlyPrice: input.hours * 10000, description: '' }
  }
  return undefined
}

export function formatNaira(amount) {
  return `₦${amount.toLocaleString('en-NG')}`
}
