
Breaking changes from JavaScript version:

* Node keys are no longer coerced to strings. The new implementation uses ES6 Maps, so any key that is suitable as a key for a Map will do.
* PriorityQueue keys are no longer coerced to strings.
* The Dijkstra and Floyd–Warshall algorithms return ES6 Maps instead of objects.
