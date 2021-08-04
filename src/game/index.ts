import classnames from 'classnames'
import dayjs from 'dayjs'
import Pool from './pool'
import { quantize, timeToPosition } from './util'

const $game: HTMLElement = document.getElementById('game')!
const $lains: HTMLElement = document.getElementById('lains')!
const $judgement: HTMLElement = document.getElementById('judgement')!

const domConfig = {
  lainWidth: 48,
  lainHeight: 512,
}

const liveConfig = {
  startTime: 1000,
  timeRange: 1000,
  keyCount: 5,
  tolerance: 110,
  bias: 60, // px
}

document.getElementById('bias-line')!.style.bottom = `${liveConfig.bias}px`
// document.getElementById('test-line')!.style.bottom = `${
//   timeToPosition(liveConfig.tolerance, liveConfig.timeRange, domConfig.lainHeight) +
//   liveConfig.bias
// }px`

const judgements = [
  {
    label: 'PERFECT',
    tolerance: 30,
  },
  {
    label: 'GOOD',
    tolerance: 60,
  },
  {
    label: 'NORMAL',
    tolerance: 70,
  },
  {
    label: 'BAD',
    tolerance: liveConfig.tolerance,
  },
]

const keyState: { [key: string]: boolean } = {}

const keyConfig = ['e', 'f', ' ', 'j', 'i']

interface Note {
  timestamp: number // ms
  lainIndex: number
  isLongNote?: boolean
}

interface IntegratedNote extends Note {
  id: number
  dom: HTMLElement
}

const notePool = new Pool<IntegratedNote>()
let spawnCounter = 0
let notes: Note[] = []

/// TEST SPAWN
let test = 1000
let lastLain = -1
let temp = false
for (let i = 0; i < 1024; ++i) {
  /*
  let newLain = Math.floor(Math.random() * liveConfig.keyCount * 0.9999)
  while (newLain === lastLain) {
    newLain = Math.floor(Math.random() * liveConfig.keyCount * 0.9999)
  }
  lastLain = newLain*/
  notes.push({
    timestamp: test,
    lainIndex: temp ? 1 : 3,
  })
  temp = !temp
  test += 80
}

let lastFrameTime: dayjs.Dayjs = dayjs()
let timer = 0

function spawnNote(note: Note) {
  const dom = document.createElement('div')
  dom.className = 'note'
  dom.style.transform = `translateY(-9999px)`

  const newNote = {
    ...note,
    dom,
    id: -1,
  }

  newNote.id = notePool.add(newNote)

  $lains.children[note.lainIndex].appendChild(dom)
}

function despawnNote(note: IntegratedNote) {
  notePool.remove(note.id)
  $lains.children[note.lainIndex].removeChild(note.dom)
}

function spawn() {
  while (
    spawnCounter < notes.length &&
    notes[spawnCounter].timestamp - timer <= liveConfig.timeRange
  ) {
    spawnNote(notes[spawnCounter])
    ++spawnCounter
  }
}

async function render() {
  highlightPressedLains()
  shiftNotes()
}

async function highlightPressedLains() {
  let index = 0
  for (const $lain of $lains.children) {
    const isActive = !!keyState[keyConfig[index].toLowerCase()]
    $lain.className = classnames('lain', { active: isActive })
    ++index
  }
}

async function shiftNotes() {
  notePool.forEach((note) => {
    const timediff = timer - note.timestamp
    const y = timeToPosition(timediff, liveConfig.timeRange, domConfig.lainHeight)
    note.dom.style.transform = `translateY(${y - liveConfig.bias}px)`
  })
}

function processNotes() {
  const despawnList: IntegratedNote[] = []
  notePool.forEach((integratedNote) => {
    const timediff = timer - integratedNote.timestamp
    if (timediff > liveConfig.tolerance) {
      $judgement.innerText = 'miss'
      despawnList.push(integratedNote)
    }
  })

  despawnList.forEach((note) => despawnNote(note))
}

async function debug() {
  const $console = document.getElementById('console')!

  $console.innerText = ''
  notePool.forEach((note) => {
    $console.innerText += `${note.id}: lain ${note.lainIndex} @ ${note.timestamp}\n`
  })
  $console.innerText += `Pool upperbound: ${notePool.upperBound}\n`
}

function loop() {
  const newFrameTime = dayjs()
  const difference = newFrameTime.diff(lastFrameTime, 'millisecond')
  lastFrameTime = newFrameTime
  timer += difference

  render()
  spawn()
  processNotes()
  debug()

  setTimeout(loop, 1)
}

export function start() {
  document.addEventListener('keydown', (event: KeyboardEvent) => {
    keyState[event.key] = true

    // 노트 처리
    let notes: IntegratedNote[] = []
    notePool.forEach((note) => {
      const diff = timer - note.timestamp

      if (
        Math.abs(diff) < liveConfig.tolerance &&
        note.lainIndex === keyConfig.indexOf(event.key)
      ) {
        notes.push(note)
      }
    })

    notes = notes.sort((a, b) => a.timestamp - b.timestamp)

    const despawnList: IntegratedNote[] = []
    const isLainHit: boolean[] = []
    notes.forEach((note) => {
      const diff = timer - note.timestamp

      if (!isLainHit[note.lainIndex]) {
        for (const judgement of judgements) {
          if (Math.abs(diff) <= judgement.tolerance) {
            $judgement.innerText = judgement.label
            despawnList.push(note)
            break
          }
        }
        isLainHit[note.lainIndex] = true
      }
    })
    despawnList.forEach((note) => despawnNote(note))
  })

  document.addEventListener('keyup', (event: KeyboardEvent) => {
    keyState[event.key] = false
  })
  loop()
}
