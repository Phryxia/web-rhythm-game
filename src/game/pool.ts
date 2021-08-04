export default class Pool<T> {
  data: (T | null)[] = []
  size: number = 0
  currentPointer: number = 0
  upperBound: number = 0

  add(element: T): number {
    const lastStart = Math.min(this.currentPointer, this.upperBound - 1)
    while (this.currentPointer < this.upperBound && this.data[this.currentPointer]) {
      ++this.currentPointer
    }

    if (this.currentPointer >= this.upperBound) {
      this.currentPointer = 0
      while (this.currentPointer < lastStart && this.data[this.currentPointer]) {
        ++this.currentPointer
      }
    }

    if (this.currentPointer >= this.upperBound || this.data[this.currentPointer]) {
      this.currentPointer = this.upperBound
      ++this.upperBound
    }

    this.data[this.currentPointer] = element

    return this.currentPointer
  }

  remove(id: number) {
    this.data[id] = null
    if (id === this.upperBound - 1) {
      --this.upperBound
    } else {
      this.currentPointer = id
    }
  }

  forEach(callback: (element: T, id: number, count: number) => void) {
    let counting = 0
    this.data.forEach((element, index) => {
      if (index >= this.upperBound) return
      if (element) {
        callback(element, index, counting)
        ++counting
      }
    })
  }
}
