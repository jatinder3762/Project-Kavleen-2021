const encouragements = [
  'Great job!',
  'You did it!',
  'Awesome job!',
  'Amazing!',
  'Well done!',
  'Keep going!',
  'Nice work!',
]

export function pickEncouragement() {
  return encouragements[Math.floor(Math.random() * encouragements.length)]
}

export function speak(message: string) {
  if (!('speechSynthesis' in window)) return

  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(message)
  utterance.rate = 0.9
  utterance.pitch = 1.25
  utterance.volume = 1
  window.speechSynthesis.speak(utterance)
}
