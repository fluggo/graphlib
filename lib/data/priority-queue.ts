interface PQEntry<K> {
  key: K;
  priority: number;
}

/**
 * A min-priority queue data structure. This algorithm is derived from Cormen,
 * et al., "Introduction to Algorithms". The basic idea of a min-priority
 * queue is that you can efficiently (in O(1) time) get the smallest key in
 * the queue. Adding and removing elements takes O(log n) time. A key can
 * have its priority decreased in O(log n) time.
 */
export default class PriorityQueue<K> {
  _arr: PQEntry<K>[];
  _keyIndices: Map<K, number>;

  constructor() {
    this._arr = [];
    this._keyIndices = new Map();
  }

  /**
   * Returns the number of elements in the queue. Takes `O(1)` time.
   */
  size(): number {
    return this._arr.length;
  }

  /**
   * Returns the keys that are in the queue. Takes `O(n)` time.
   */
  keys(): K[] {
    return this._arr.map(x => x.key);
  }

  /**
   * Returns `true` if **key** is in the queue and `false` if not.
   */
  has(key: K): boolean {
    return this._keyIndices.has(key);
  }

  /**
   * Returns the priority for **key**. If **key** is not present in the queue
   * then this function returns `undefined`. Takes `O(1)` time.
   */
  priority(key: K): number | undefined {
    const index = this._keyIndices.get(key);
    if(index !== undefined) {
      return this._arr[index].priority;
    }
  }

  /**
   * Returns the key for the minimum element in this queue. If the queue is
   * empty this function throws an Error. Takes `O(1)` time.
   */
  min(): K {
    if(this.size() === 0) {
      throw new Error('Queue underflow');
    }
    return this._arr[0].key;
  }

  /**
   * Inserts a new key into the priority queue. If the key already exists in
   * the queue this function returns `false`; otherwise it will return `true`.
   * Takes `O(n)` time.
   *
   * @param key the key to add
   * @param priority the initial priority for the key
   */
  add(key: K, priority: number): boolean {
    const keyIndices = this._keyIndices;
    if(!keyIndices.has(key)) {
      const arr = this._arr;
      const index = arr.length;
      keyIndices.set(key, index);
      arr.push({key: key, priority: priority});
      this._decrease(index);
      return true;
    }
    return false;
  }

  /**
   * Removes and returns the smallest key in the queue. Takes `O(log n)` time.
   */
  removeMin(): K | undefined {
    this._swap(0, this._arr.length - 1);
    const min = this._arr.pop()!;
    this._keyIndices.delete(min.key);
    this._heapify(0);
    return min.key;
  }

  /**
   * Decreases the priority for **key** to **priority**. If the new priority is
   * greater than the previous priority, this function will throw an Error.
   *
   * @param key the key for which to raise priority
   * @param priority the new priority for the key
   */
  decrease(key: K, priority: number): void {
    const index = this._keyIndices.get(key);

    if(index === undefined)
      throw new RangeError('Key out of range');

    if(priority > this._arr[index].priority) {
      throw new Error('New priority is greater than current priority. ' +
          `Key: ${String(key)} Old: ${this._arr[index].priority} New: ${priority}`);
    }
    this._arr[index].priority = priority;
    this._decrease(index);
  }

  private _heapify(i: number): void {
    const arr = this._arr;
    const l = 2 * i;
    const r = l + 1;
    let largest = i;
    if(l < arr.length) {
      largest = arr[l].priority < arr[largest].priority ? l : largest;
      if(r < arr.length) {
        largest = arr[r].priority < arr[largest].priority ? r : largest;
      }
      if(largest !== i) {
        this._swap(i, largest);
        this._heapify(largest);
      }
    }
  }

  private _decrease(index: number): void {
    const arr = this._arr;
    const priority = arr[index].priority;
    let parent: number;
    while(index !== 0) {
      // eslint-disable-next-line no-bitwise
      parent = index >> 1;
      if(arr[parent].priority < priority) {
        break;
      }
      this._swap(index, parent);
      index = parent;
    }
  }

  private _swap(i: number, j: number): void {
    const arr = this._arr;
    const keyIndices = this._keyIndices;
    const origArrI = arr[i];
    const origArrJ = arr[j];
    arr[i] = origArrJ;
    arr[j] = origArrI;
    keyIndices.set(origArrJ.key, i);
    keyIndices.set(origArrI.key, j);
  }
}
