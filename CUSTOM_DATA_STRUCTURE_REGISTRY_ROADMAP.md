# Sarthi Custom Data Structure Registry Architecture & Roadmap 🗺️

- **Document Status**: APPROVED ARCHITECTURAL ROADMAP
- **Scope**: Schema-Driven Custom Data Structure Support (LeetCode-style complex nodes)

---

## 1. Executive Summary

Sarthi's **Custom Data Structure Registry** transforms custom LeetCode data types (e.g. linked lists with random pointers, undirected graph nodes, N-ary tree nodes, QuadTree nodes) from hardcoded, problem-specific implementations into a **declarative, schema-driven framework**.

Instead of writing custom parser/serializer/comparator/generator code for every single problem, new custom structures are defined as **Schema Definitions** in the registry.

---

## 2. Multi-Phase Roadmap Overview

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                      CUSTOM DATA STRUCTURE ENGINE ROADMAP                        │
├───────────────────────────────────────────────────────────────────────────────────┤
│ 🟢 Phase 1: Core Registry & `random_list_node` (Current)                           │
│    • Core `CustomTypeRegistry` engine foundation                                 │
│    • Schema `random_list_node` for LeetCode #138 (Copy List with Random Pointer)  │
│    • Isomorphic pointer list comparator & starter code class synthesizer        │
├───────────────────────────────────────────────────────────────────────────────────┤
│ 🔵 Phase 2: Graph & Tree Node Expansion                                          │
│    • Schema `graph_node` for LeetCode #133 (Clone Graph)                          │
│    • Schema `nary_tree_node` for LeetCode #428 (N-ary Tree Serialization)         │
│    • Universal Graph Isomorphism Comparator (DFS/BFS graph equality)            │
├───────────────────────────────────────────────────────────────────────────────────┤
│ 🟣 Phase 3: Spatial & Prefix Tree Structures                                      │
│    • Schema `quad_tree_node` for LeetCode #427 (Construct Quad Tree)              │
│    • Schema `trie_node` for LeetCode #208 (Implement Trie)                        │
│    • Multi-pointer spatial grid serializers                                       │
├───────────────────────────────────────────────────────────────────────────────────┤
│ 🟡 Phase 4: Author-Defined Custom Schema Studio (No-Code Custom Type Creator)     │
│    • Interactive Schema Builder in Sarthi CMS Studio UI                           │
│    • Dynamic 4-Language Class/Struct Generator (Python, JS, C++, Java)            │
│    • Zero-code custom node execution engine                                       │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Phase Breakdown

### 🟢 Phase 1: Core Registry & `random_list_node` (Current Phase)
* **Objective**: Build the generic `CustomTypeRegistry` engine and prove end-to-end zero-hardcoding extensibility.
* **Key Components**:
  1. `CustomTypeRegistry`: Central schema registry storing field definitions, pointer relationships, and language-specific class headers.
  2. `random_list_node` Schema:
     ```javascript
     {
       id: 'random_list_node',
       label: 'Random List Node (val, next, random)',
       className: 'Node',
       fields: [
         { name: 'val', type: 'integer' },
         { name: 'next', type: 'pointer', target: 'self', relation: 'singly_linked' },
         { name: 'random', type: 'pointer', target: 'self', relation: 'index_reference', nullable: true }
       ],
       serializationFormat: 'pair_array' // [[7, null], [13, 0], [11, 4], ...]
     }
     ```
  3. `RandomListComparator`: Deep isomorphic matcher verifying values, list length, and random pointer target indices.
  4. `RandomListGeneratorPlugin`: Generates valid 2D pair arrays `[[val, random_idx], ...]`.
  5. `TemplateGenerator` Integration: Prepends `class Node` definitions in Python, C++, Java, and JS starter code automatically.
  6. Preset Integration: **Copy List with Random Pointer (LeetCode #138)** preset added to `ProblemPatternRegistry.js`.

---

### 2. Phase 2: Graph & Tree Node Expansion
* **Objective**: Expand registry schemas to cover all standard graph & tree node formats.
* **Key Schemas**:
  1. `graph_node`: `Node { val, neighbors }` (LeetCode #133: *Clone Graph*). Serialized as Adjacency Lists `[[2, 4], [1, 3], [2, 4], [1, 3]]`.
  2. `nary_tree_node`: `Node { val, children }` (LeetCode #428: *N-ary Tree Serialization*). Serialized as Level-Order arrays with `null` child breaks `[1, null, 3, 2, 4, null, 5, 6]`.
  3. Universal `GraphIsomorphismComparator`: Generic BFS/DFS structural graph matcher working across any schema with pointer array edges.

---

### 3. Phase 3: Spatial & Prefix Tree Structures
* **Objective**: Support 2D spatial partitioning and prefix trees.
* **Key Schemas**:
  1. `quad_tree_node`: `Node { val, isLeaf, topLeft, topRight, bottomLeft, bottomRight }` (LeetCode #427: *Construct Quad Tree*).
  2. `trie_node`: `TrieNode { children: Node[26], isEndOfWord }` (LeetCode #208: *Implement Trie*).
  3. Spatial & Trie Serializer / Deserializer suite.

---

### 4. Phase 4: Author-Defined Custom Schema Studio (No-Code Custom Type Creator)
* **Objective**: Empower problem authors to design brand-new custom C++/Java/Python/JS data structures directly inside Sarthi CMS UI without modifying backend code.
* **Features**:
  1. **Schema Builder UI**: Drag-and-drop / Form UI to add fields (`name`, `type`, `isPointer`, `isNullable`).
  2. **Starter Code Synthesizer**: Generates `struct`/`class` code for Python, C++, Java, and JS on-the-fly.
  3. **Universal Heap Builder**: Deserializes generic JSON payloads into runtime heap graphs inside execution sandboxes.

---

## 4. Summary Table of Phases

| Phase | Main Goal | Key Schema / Feature | Target Problems |
| :--- | :--- | :--- | :--- |
| **Phase 1** | Registry Engine + Random List | `random_list_node` | LeetCode #138 (*Copy List with Random Pointer*) |
| **Phase 2** | Graph & N-ary Tree Nodes | `graph_node`, `nary_tree_node` | LeetCode #133 (*Clone Graph*), #589 (*N-ary Traversal*) |
| **Phase 3** | QuadTree & Trie Structures | `quad_tree_node`, `trie_node` | LeetCode #427 (*Quad Tree*), #208 (*Implement Trie*) |
| **Phase 4** | No-Code Studio Schema Creator | Universal Custom Type Builder UI | Any novel user-defined data structure |

---

*This document is saved as a reference for Sarthi's long-term architecture.*
