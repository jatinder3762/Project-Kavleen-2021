import type { VoiceSettings } from '../types'

const encouragements = [
  'Great job!',
  'You did it!',
  'Awesome job!',
  'Amazing!',
  'Well done!',
  'Keep going!',
  'Nice work!',
]

const femaleVoiceHints = [
  'samantha',
  'victoria',
  'karen',
  'moira',
  'tessa',
  'fiona',
  'zira',
  'susan',
  'hazel',
  'aria',
  'jenny',
  'sonia',
  'female',
  'google uk english female',
]

export function pickEncouragement() {
  return encouragements[Math.floor(Math.random() * encouragements.length)]
}

export function getEnglishVoices() {
  if (!('speechSynthesis' in window)) return []

  return window.speechSynthesis
    .getVoices()
    .filter((voice) => voice.lang.toLowerCase().startsWith('en'))
    .sort((a, b) => a.name.localeCompare(b.name))
}

function pickFemaleVoice(preferredVoiceURI?: string) {
  const voices = getEnglishVoices()
  if (!voices.length) return null

  if (preferredVoiceURI) {
    const preferred = voices.find((voice) => voice.voiceURI === preferredVoiceURI)
    if (preferred) return preferred
  }

  const namedFemale = voices.find((voice) => {
    const haystack = `${voice.name} ${voice.voiceURI}`.toLowerCase()
    return femaleVoiceHints.some((hint) => haystack.includes(hint))
  })

  return namedFemale ?? voices.find((voice) => voice.default) ?? voices[0]
}

export function speak(
  message: string,
  settings: VoiceSettings = {
    enabled: true,
    voiceURI: '',
    rate: 0.9,
    pitch: 1.15,
  },
) {
  if (!settings.enabled || !('speechSynthesis' in window)) return

  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(message)
  const voice = pickFemaleVoice(settings.voiceURI)

  if (voice) {
    utterance.voice = voice
    utterance.lang = voice.lang
  } else {
    utterance.lang = 'en-US'
  }

  utterance.rate = settings.rate
  utterance.pitch = settings.pitch
  utterance.volume = 1
  window.speechSynthesis.speak(utterance)
}
