'use strict';
(() => {
  const TYPE_INFO = {
    singly: { title: 'Singly linked list', file: 'singly_linked_list.c', shape: 'Linear', rule: 'Each node has info and next. The tail points to NULL. Keep prev while walking to the tail for deletion.' },
    circular: { title: 'Circular singly linked list', file: 'circular_linked_list.c', shape: 'Circular', rule: 'Each node has info and next. The tail points back to head. Stop traversal when the next pointer returns to head, not at NULL.' },
    doubly: { title: 'Doubly linked list', file: 'doubly_linked_list.c', shape: 'Two-way', rule: 'Each node has prev, info, and next. Update both directions when linking or unlinking. The head prev and tail next are NULL.' }
  };
  const GROUPS = [
    { name: 'INSERT', items: [
      ['insertFront','Insert at front','＋'], ['insertEnd','Insert at end','＋'], ['insertAtPosition','Insert at position','⊕'], ['insertAfter','Insert after value','↳'], ['insertBefore','Insert before value','↰']
    ]},
    { name: 'DELETE', items: [
      ['deleteFront','Delete front','−'], ['deleteEnd','Delete end','−'], ['deleteAtPosition','Delete at position','×'], ['deleteByValue','Delete by value','⌫'], ['deleteAllOccurrences','Delete all matches','××']
    ]},
    { name: 'INSPECT', items: [
      ['search','Search value','⌕'], ['update','Update value','✎'], ['count','Count nodes','#'], ['display','Display list','≡'], ['findMiddle','Find middle','↔'], ['nthFromEnd','Nth from end','N']
    ]},
    { name: 'TRANSFORM', items: [
      ['reverse','Reverse list','⇄'], ['sort','Sort ascending','↕'], ['rotateLeft','Rotate left','↶'], ['rotateRight','Rotate right','↷'], ['removeDuplicates','Remove duplicates','◇'], ['palindrome','Check palindrome','⟷'], ['clear','Clear list','⌧']
    ]}
  ];
  const OP_META = {
    insertFront:{title:'Insert at front',description:'Create a node and connect it before the current head.',fields:[{id:'valueA',label:'Value to insert',placeholder:'e.g. 5',type:'integer'}],mutates:true},
    insertEnd:{title:'Insert at end',description:'Walk to the tail and attach the new node.',fields:[{id:'valueA',label:'Value to insert',placeholder:'e.g. 40',type:'integer'}],mutates:true},
    insertAtPosition:{title:'Insert at position',description:'Insert at a 1-based position. Position n + 1 appends to the list.',fields:[{id:'valueA',label:'Value to insert',placeholder:'e.g. 25',type:'integer'},{id:'position',label:'Position (1-based)',placeholder:'e.g. 2',type:'integer'}],mutates:true},
    insertAfter:{title:'Insert after value',description:'Insert a new node after the first node matching the reference value.',fields:[{id:'valueA',label:'New node value',placeholder:'e.g. 25',type:'integer'},{id:'reference',label:'Insert after this value',placeholder:'e.g. 20',type:'integer'}],mutates:true},
    insertBefore:{title:'Insert before value',description:'Insert a new node before the first node matching the reference value.',fields:[{id:'valueA',label:'New node value',placeholder:'e.g. 15',type:'integer'},{id:'reference',label:'Insert before this value',placeholder:'e.g. 20',type:'integer'}],mutates:true},
    deleteFront:{title:'Delete front',description:'Move head to the second node and safely release the old first node.',fields:[],mutates:true},
    deleteEnd:{title:'Delete end',description:'Find the tail and its predecessor, then disconnect and release the tail.',fields:[],mutates:true},
    deleteAtPosition:{title:'Delete at position',description:'Delete the node at a 1-based position.',fields:[{id:'position',label:'Position (1-based)',placeholder:'e.g. 2',type:'integer'}],mutates:true},
    deleteByValue:{title:'Delete by value',description:'Delete only the first node that matches the value.',fields:[{id:'valueA',label:'Value to delete',placeholder:'e.g. 20',type:'integer'}],mutates:true},
    deleteAllOccurrences:{title:'Delete all matches',description:'Remove every node matching the value, including repeated matches.',fields:[{id:'valueA',label:'Value to remove',placeholder:'e.g. 20',type:'integer'}],mutates:true},
    search:{title:'Search value',description:'Traverse the list and report every 1-based position containing the value.',fields:[{id:'valueA',label:'Value to find',placeholder:'e.g. 20',type:'integer'}],mutates:false},
    update:{title:'Update value',description:'Replace the value in the first matching node. The node itself stays in place.',fields:[{id:'valueA',label:'Current value',placeholder:'e.g. 20',type:'integer'},{id:'valueB',label:'New value',placeholder:'e.g. 99',type:'integer'}],mutates:true},
    count:{title:'Count nodes',description:'Visit each node once and count how many nodes are in the structure.',fields:[],mutates:false},
    display:{title:'Display list',description:'Traverse the list in order and print each node value.',fields:[],mutates:false},
    findMiddle:{title:'Find middle',description:'Use the standard slow/fast pointer idea. For an even number of nodes, this returns the second middle.',fields:[],mutates:false},
    nthFromEnd:{title:'Nth node from end',description:'Find the Nth node counted backward from the tail. N = 1 means the last node.',fields:[{id:'position',label:'N from the end',placeholder:'e.g. 2',type:'integer'}],mutates:false},
    reverse:{title:'Reverse list',description:'Reverse the node order. The visualization rebuilds the links for the selected structure.',fields:[],mutates:true},
    sort:{title:'Sort ascending',description:'Arrange node values in increasing numerical order. Equal values are retained.',fields:[],mutates:true},
    rotateLeft:{title:'Rotate left',description:'Move the first k nodes to the end. k may be larger than the list length.',fields:[{id:'position',label:'Rotation steps',placeholder:'e.g. 1',type:'integer'}],mutates:true},
    rotateRight:{title:'Rotate right',description:'Move the last k nodes to the front. k may be larger than the list length.',fields:[{id:'position',label:'Rotation steps',placeholder:'e.g. 1',type:'integer'}],mutates:true},
    removeDuplicates:{title:'Remove duplicates',description:'Keep the first occurrence of each value and remove later duplicates.',fields:[],mutates:true},
    palindrome:{title:'Check palindrome',description:'Check whether the values read the same forward and backward.',fields:[],mutates:false},
    clear:{title:'Clear list',description:'Remove every node and leave head pointing to NULL.',fields:[],mutates:true}
  };
  const GLYPHS = Object.fromEntries(GROUPS.flatMap(g=>g.items));
  let type = 'singly';
  let nextId = 1;
  let nodes = [makeNode(10), makeNode(20), makeNode(30)];
  let history = [];
  let activeOp = 'insertFront';
  let trace = null;
  let playTimer = null;
  let toastTimer = null;
  const $ = id => document.getElementById(id);
  function makeNode(value) { return { id: nextId++, value: Number(value) }; }
  function cloneNodes(list) { return list.map(n => ({id:n.id, value:n.value})); }
  function esc(value) { return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function nodeIndex(list, id) { return list.findIndex(n => n.id === id); }
  function rolesAt(list, index, extra={}) {
    const r = {...extra};
    if (list[0]) r.head = list[0].id;
    if (list.length) r.tail = list[list.length-1].id;
    if (index >= 0 && list[index]) r.temp = list[index].id;
    if (index > 0 && list[index-1]) r.prev = list[index-1].id;
    return r;
  }
  function pushStep(steps, title, detail, code, viewNodes, roles={}, opts={}) {
    steps.push({title, detail, code, viewNodes:cloneNodes(viewNodes), roles:{...roles}, extraNode: opts.extraNode ? {...opts.extraNode} : null, output: opts.output || '', final:!!opts.final});
  }
  function codeFor(op, listType=type) {
    const circular = listType === 'circular'; const doubly = listType === 'doubly';
    const stop = circular ? 'while (temp->next != head)' : 'while (temp->next != NULL)';
    const walk = circular ? 'do { /* visit temp */ temp = temp->next; } while (temp != head);' : 'while (temp != NULL) { /* visit temp */ temp = temp->next; }';
    const snippets = {
      insertFront: {
        singly: `struct node *newNode = malloc(sizeof *newNode);\nif (!newNode) return;\nnewNode->info = value;\nnewNode->next = head;\nhead = newNode;`,
        circular: `struct node *newNode = malloc(sizeof *newNode);\nif (!newNode) return;\nnewNode->info = value;\nif (head == NULL) {\n    head = newNode;\n    newNode->next = head;\n} else {\n    struct node *last = head;\n    while (last->next != head) last = last->next;\n    newNode->next = head;\n    last->next = newNode;\n    head = newNode;\n}`,
        doubly: `struct node *newNode = malloc(sizeof *newNode);\nif (!newNode) return;\nnewNode->info = value;\nnewNode->prev = NULL;\nnewNode->next = head;\nif (head != NULL) head->prev = newNode;\nhead = newNode;`
      },
      insertEnd: {
        singly: `struct node *newNode = malloc(sizeof *newNode);\nif (!newNode) return;\nnewNode->info = value;\nnewNode->next = NULL;\nif (head == NULL) { head = newNode; return; }\nstruct node *temp = head;\n${stop}\ntemp->next = newNode;`,
        circular: `struct node *newNode = malloc(sizeof *newNode);\nif (!newNode) return;\nnewNode->info = value;\nif (head == NULL) {\n    head = newNode; newNode->next = head; return;\n}\nstruct node *temp = head;\nwhile (temp->next != head) temp = temp->next;\nnewNode->next = head;\ntemp->next = newNode;`,
        doubly: `struct node *newNode = malloc(sizeof *newNode);\nif (!newNode) return;\nnewNode->info = value;\nnewNode->next = NULL;\nif (head == NULL) { newNode->prev = NULL; head = newNode; return; }\nstruct node *temp = head;\nwhile (temp->next != NULL) temp = temp->next;\ntemp->next = newNode;\nnewNode->prev = temp;`
      },
      deleteFront: {
        singly: `if (head == NULL) return;\nstruct node *temp = head;\nhead = head->next;\nfree(temp);`,
        circular: `if (head == NULL) return;\nstruct node *temp = head;\nif (head->next == head) head = NULL;\nelse {\n    struct node *last = head;\n    while (last->next != head) last = last->next;\n    head = head->next;\n    last->next = head;\n}\nfree(temp);`,
        doubly: `if (head == NULL) return;\nstruct node *temp = head;\nhead = head->next;\nif (head != NULL) head->prev = NULL;\nfree(temp);`
      },
      deleteEnd: {
        singly: `if (head == NULL) return;\nstruct node *temp = head, *prev = NULL;\nwhile (temp->next != NULL) {\n    prev = temp; temp = temp->next;\n}\nif (prev == NULL) head = NULL;\nelse prev->next = NULL;\nfree(temp);`,
        circular: `if (head == NULL) return;\nstruct node *temp = head, *prev = NULL;\nwhile (temp->next != head) {\n    prev = temp; temp = temp->next;\n}\nif (prev == NULL) head = NULL;\nelse prev->next = head;\nfree(temp);`,
        doubly: `if (head == NULL) return;\nstruct node *temp = head;\nwhile (temp->next != NULL) temp = temp->next;\nif (temp->prev != NULL) temp->prev->next = NULL;\nelse head = NULL;\nfree(temp);`
      },
      insertAtPosition: {
        singly: `/* position is 1-based */\nif (position == 1) { /* use insertFront */ }\nstruct node *temp = head;\nfor (int i = 1; i < position - 1; i++)\n    temp = temp->next;\nnewNode->next = temp->next;\ntemp->next = newNode;`,
        circular: `/* position is 1-based */\nif (position == 1) { /* update last->next and head */ }\nstruct node *temp = head;\nfor (int i = 1; i < position - 1; i++)\n    temp = temp->next;\nnewNode->next = temp->next;\ntemp->next = newNode;`,
        doubly: `/* position is 1-based */\nstruct node *temp = head;\nfor (int i = 1; i < position - 1; i++)\n    temp = temp->next;\nnewNode->next = temp->next;\nnewNode->prev = temp;\nif (temp->next) temp->next->prev = newNode;\ntemp->next = newNode;`
      },
      deleteAtPosition: {
        singly: `/* locate target and its predecessor */\nstruct node *temp = head, *prev = NULL;\nfor (int i = 1; i < position; i++) {\n    prev = temp; temp = temp->next;\n}\nif (prev == NULL) head = temp->next;\nelse prev->next = temp->next;\nfree(temp);`,
        circular: `/* position is 1-based; special-case one node */\nstruct node *temp = head, *prev = NULL;\nfor (int i = 1; i < position; i++) {\n    prev = temp; temp = temp->next;\n}\nif (prev == NULL) { /* update tail->next and head */ }\nelse prev->next = temp->next;\nfree(temp);`,
        doubly: `struct node *temp = head;\nfor (int i = 1; i < position; i++)\n    temp = temp->next;\nif (temp->prev) temp->prev->next = temp->next;\nelse head = temp->next;\nif (temp->next) temp->next->prev = temp->prev;\nfree(temp);`
      },
      search: {
        singly: `struct node *temp = head;\nint position = 1;\nwhile (temp != NULL) {\n    if (temp->info == key) printf("Found at %d", position);\n    temp = temp->next; position++;\n}`,
        circular: `if (head != NULL) {\n    struct node *temp = head; int position = 1;\n    do {\n        if (temp->info == key) printf("Found at %d", position);\n        temp = temp->next; position++;\n    } while (temp != head);\n}`,
        doubly: `struct node *temp = head;\nint position = 1;\nwhile (temp != NULL) {\n    if (temp->info == key) printf("Found at %d", position);\n    temp = temp->next; position++;\n}`
      },
      count: {
        singly: `int count = 0;\nfor (struct node *temp = head; temp != NULL;\n     temp = temp->next) count++;`,
        circular: `int count = 0;\nif (head != NULL) {\n    struct node *temp = head;\n    do { count++; temp = temp->next; } while (temp != head);\n}`,
        doubly: `int count = 0;\nfor (struct node *temp = head; temp != NULL;\n     temp = temp->next) count++;`
      },
      display: {
        singly: `for (struct node *temp = head; temp != NULL;\n     temp = temp->next)\n    printf("%d -> ", temp->info);\nprintf("NULL\\n");`,
        circular: `if (head != NULL) {\n    struct node *temp = head;\n    do {\n        printf("%d -> ", temp->info);\n        temp = temp->next;\n    } while (temp != head);\n    printf("(back to head)\\n");\n}`,
        doubly: `for (struct node *temp = head; temp != NULL;\n     temp = temp->next)\n    printf("%d <-> ", temp->info);\nprintf("NULL\\n");`
      },
      reverse: {
        singly: `struct node *prev = NULL, *cur = head, *next = NULL;\nwhile (cur != NULL) {\n    next = cur->next;\n    cur->next = prev;\n    prev = cur; cur = next;\n}\nhead = prev;`,
        circular: `/* Break the loop, reverse links, then close it again. */\nif (head == NULL || head->next == head) return;\nstruct node *tail = head;\nwhile (tail->next != head) tail = tail->next;\ntail->next = NULL; /* linearize first */\n/* reverse next pointers as in a singly list */\n/* set new head, then connect new tail to head */`,
        doubly: `struct node *cur = head, *swap = NULL;\nwhile (cur != NULL) {\n    swap = cur->prev;\n    cur->prev = cur->next;\n    cur->next = swap;\n    cur = cur->prev;\n}\nif (swap != NULL) head = swap->prev;`
      },
      update: {
        singly: `for (struct node *temp = head; temp != NULL;\n     temp = temp->next) {\n    if (temp->info == oldValue) {\n        temp->info = newValue; break;\n    }\n}`,
        circular: `if (head != NULL) {\n    struct node *temp = head;\n    do {\n        if (temp->info == oldValue) {\n            temp->info = newValue; break;\n        }\n        temp = temp->next;\n    } while (temp != head);\n}`,
        doubly: `for (struct node *temp = head; temp != NULL;\n     temp = temp->next) {\n    if (temp->info == oldValue) {\n        temp->info = newValue; break;\n    }\n}`
      }
    };
    if (snippets[op] && snippets[op][listType]) return snippets[op][listType];
    const generic = {
      insertBefore: `/* Find first node with info == target. */\n/* Link newNode before it; handle head separately. */`,
      deleteByValue: `/* Find first matching node and its predecessor. */\n/* Reconnect predecessor/successor, then free target. */`,
      deleteAllOccurrences: `/* Traverse with temp and prev. */\n/* Unlink every match; do not advance prev on deletion. */`,
      nthFromEnd: `/* Use two pointers: advance fast N nodes. */\n/* Move fast and slow together; slow reaches Nth from tail. */`,
      findMiddle: `struct node *slow = head, *fast = head;\nwhile (fast != NULL && fast->next != NULL) {\n    slow = slow->next;\n    fast = fast->next->next;\n}\n/* slow is the middle (second middle for even length). */`,
      sort: `/* Compare node values and swap info fields. */\n/* Repeat until a full pass makes no swaps. */`,
      rotateLeft: `/* Find the new head after k % length nodes. */\n/* Reconnect the old tail and new tail safely. */`,
      rotateRight: `/* A right rotation by k is a left rotation by length-k. */\n/* Reconnect tail, new head, and new tail. */`,
      removeDuplicates: `/* For each node, scan later nodes. */\n/* Unlink duplicates and free them; preserve first occurrence. */`,
      palindrome: `/* Compare values from both ends. */\n/* true when every mirrored pair is equal. */`,
      clear: {singly:`while (head != NULL) {\n    struct node *temp = head;\n    head = head->next;\n    free(temp);\n}`,circular:`if (head != NULL) {\n    struct node *last = head;\n    while (last->next != head) last = last->next;\n    last->next = NULL; /* break the loop */\n}\nwhile (head != NULL) {\n    struct node *temp = head;\n    head = head->next;\n    free(temp);\n}`,doubly:`while (head != NULL) {\n    struct node *temp = head;\n    head = head->next;\n    free(temp);\n}\n/* head is NULL; no nodes remain */`},
      insertEnd: `/* Allocate a new node and locate the tail. */\n/* Link tail to new node; keep circular/doubly rules. */`,
      insertAtPosition: `/* Walk to position - 1, then reconnect neighbors. */`,
      deleteAtPosition: `/* Find the target, reconnect neighbors, and free it. */`,
      insertAfter: `/* Find the first target node, then link newNode after it. */`,
      insertFront: `/* Set newNode->next = head; update head. */`,
      deleteFront: `/* Advance head, repair required links, then free old head. */`,
      deleteEnd: `/* Find the tail, disconnect it, and free it. */`
    };
    const advanced = {
      insertAfter: {
        singly: `struct node *temp = head;\nwhile (temp != NULL && temp->info != target)\n    temp = temp->next;\nif (temp == NULL) return;\nnewNode->next = temp->next;\ntemp->next = newNode;`,
        circular: `if (head == NULL) return;\nstruct node *temp = head;\ndo {\n    if (temp->info == target) break;\n    temp = temp->next;\n} while (temp != head);\nif (temp->info != target) return;\nnewNode->next = temp->next;\ntemp->next = newNode;`,
        doubly: `struct node *temp = head;\nwhile (temp != NULL && temp->info != target)\n    temp = temp->next;\nif (temp == NULL) return;\nnewNode->prev = temp;\nnewNode->next = temp->next;\nif (temp->next) temp->next->prev = newNode;\ntemp->next = newNode;`
      },
      insertBefore: {
        singly: `if (head == NULL) return;\nif (head->info == target) {\n    newNode->next = head; head = newNode; return;\n}\nstruct node *prev = head, *temp = head->next;\nwhile (temp != NULL && temp->info != target) {\n    prev = temp; temp = temp->next;\n}\nif (temp == NULL) return;\nnewNode->next = temp;\nprev->next = newNode;`,
        circular: `if (head == NULL) return;\nif (head->info == target) {\n    struct node *last = head;\n    while (last->next != head) last = last->next;\n    newNode->next = head; last->next = newNode; head = newNode;\n    return;\n}\nstruct node *prev = head, *temp = head->next;\nwhile (temp != head && temp->info != target) {\n    prev = temp; temp = temp->next;\n}\nif (temp == head) return;\nnewNode->next = temp; prev->next = newNode;`,
        doubly: `if (head == NULL) return;\nif (head->info == target) {\n    newNode->prev = NULL; newNode->next = head;\n    head->prev = newNode; head = newNode; return;\n}\nstruct node *temp = head;\nwhile (temp != NULL && temp->info != target) temp = temp->next;\nif (temp == NULL) return;\nnewNode->next = temp; newNode->prev = temp->prev;\ntemp->prev->next = newNode; temp->prev = newNode;`
      },
      deleteByValue: {
        singly: `struct node *temp = head, *prev = NULL;\nwhile (temp != NULL && temp->info != key) {\n    prev = temp; temp = temp->next;\n}\nif (temp == NULL) return;\nif (prev == NULL) head = temp->next;\nelse prev->next = temp->next;\nfree(temp);`,
        circular: `if (head == NULL) return;\nstruct node *temp = head, *prev = NULL;\ndo {\n    if (temp->info == key) break;\n    prev = temp; temp = temp->next;\n} while (temp != head);\nif (temp->info != key) return;\nif (temp == head && temp->next == head) head = NULL;\nelse if (temp == head) {\n    struct node *last = head;\n    while (last->next != head) last = last->next;\n    head = head->next; last->next = head;\n} else prev->next = temp->next;\nfree(temp);`,
        doubly: `struct node *temp = head;\nwhile (temp != NULL && temp->info != key) temp = temp->next;\nif (temp == NULL) return;\nif (temp->prev) temp->prev->next = temp->next;\nelse head = temp->next;\nif (temp->next) temp->next->prev = temp->prev;\nfree(temp);`
      },
      deleteAllOccurrences: {
        singly: `struct node *temp = head, *prev = NULL;\nwhile (temp != NULL) {\n    if (temp->info == key) {\n        struct node *del = temp;\n        temp = temp->next;\n        if (prev == NULL) head = temp;\n        else prev->next = temp;\n        free(del);\n    } else { prev = temp; temp = temp->next; }\n}`,
        circular: `/* Count the original nodes first; traverse at most that many. */\n/* On a match: repair head if needed, reconnect prev->next, */\n/* repair tail->next == head, then free the matched node. */\n/* Do not advance prev after deleting a node. */`,
        doubly: `struct node *temp = head;\nwhile (temp != NULL) {\n    if (temp->info == key) {\n        struct node *del = temp; temp = temp->next;\n        if (del->prev) del->prev->next = del->next;\n        else head = del->next;\n        if (del->next) del->next->prev = del->prev;\n        free(del);\n    } else temp = temp->next;\n}`
      },
      nthFromEnd: {
        singly: `struct node *fast = head, *slow = head;\nfor (int i = 0; i < n; i++) {\n    if (fast == NULL) return NULL;\n    fast = fast->next;\n}\nwhile (fast != NULL) {\n    fast = fast->next; slow = slow->next;\n}\nreturn slow;`,
        circular: `int len = countNodes(head);\nif (n < 1 || n > len) return NULL;\nstruct node *temp = head;\nfor (int i = 0; i < len - n; i++)\n    temp = temp->next;\nreturn temp;`,
        doubly: `int len = countNodes(head);\nif (n < 1 || n > len) return NULL;\nstruct node *temp = head;\nfor (int i = 0; i < len - n; i++)\n    temp = temp->next;\nreturn temp;`
      },
      findMiddle: {
        singly: `struct node *slow = head, *fast = head;\nwhile (fast != NULL && fast->next != NULL) {\n    slow = slow->next; fast = fast->next->next;\n}\nreturn slow; /* second middle for even length */`,
        circular: `if (head == NULL) return NULL;\nstruct node *slow = head, *fast = head;\nwhile (fast->next != head && fast->next->next != head) {\n    slow = slow->next; fast = fast->next->next;\n}\nif (fast->next->next == head) slow = slow->next;\nreturn slow;`,
        doubly: `struct node *slow = head, *fast = head;\nwhile (fast != NULL && fast->next != NULL) {\n    slow = slow->next; fast = fast->next->next;\n}\nreturn slow; /* second middle for even length */`
      },
      sort: {
        singly: `int len = countNodes(head);\nfor (int pass = 0; pass < len; pass++) {\n    struct node *cur = head;\n    for (int j = 0; j < len - pass - 1; j++) {\n        if (cur->info > cur->next->info)\n            swap(&cur->info, &cur->next->info);\n        cur = cur->next;\n    }\n}`,
        circular: `int len = countNodes(head);\nfor (int pass = 0; pass < len; pass++) {\n    struct node *cur = head;\n    for (int j = 0; j < len - pass - 1; j++) {\n        if (cur->info > cur->next->info)\n            swap(&cur->info, &cur->next->info);\n        cur = cur->next;\n    }\n}`,
        doubly: `int len = countNodes(head);\nfor (int pass = 0; pass < len; pass++) {\n    struct node *cur = head;\n    for (int j = 0; j < len - pass - 1; j++) {\n        if (cur->info > cur->next->info)\n            swap(&cur->info, &cur->next->info);\n        cur = cur->next;\n    }\n}`
      },
      rotateLeft: {
        singly: `int len = countNodes(head);\nif (len < 2) return;\nk %= len; if (k == 0) return;\nstruct node *newTail = head;\nfor (int i = 1; i < k; i++) newTail = newTail->next;\nstruct node *newHead = newTail->next;\nstruct node *tail = newHead;\nwhile (tail->next != NULL) tail = tail->next;\ntail->next = head; newTail->next = NULL; head = newHead;`,
        circular: `int len = countNodes(head);\nif (len == 0) return;\nk %= len;\nwhile (k-- > 0) head = head->next;\n/* The loop already closes back to the new head. */`,
        doubly: `int len = countNodes(head);\nif (len < 2) return;\nk %= len; if (k == 0) return;\nstruct node *newTail = head;\nfor (int i = 1; i < k; i++) newTail = newTail->next;\nstruct node *newHead = newTail->next;\nstruct node *tail = newHead;\nwhile (tail->next != NULL) tail = tail->next;\ntail->next = head; head->prev = tail;\nnewTail->next = NULL; newHead->prev = NULL; head = newHead;`
      },
      rotateRight: {
        singly: `int len = countNodes(head);\nif (len == 0) return;\nk %= len;\nif (k != 0) head = rotateLeft(head, len - k);`,
        circular: `int len = countNodes(head);\nif (len == 0) return;\nk %= len;\nint leftSteps = (len - k) % len;\nwhile (leftSteps-- > 0) head = head->next;`,
        doubly: `int len = countNodes(head);\nif (len == 0) return;\nk %= len;\nif (k != 0) head = rotateLeft(head, len - k);`
      },
      removeDuplicates: {
        singly: `for (struct node *cur = head; cur != NULL; cur = cur->next) {\n    struct node *runner = cur;\n    while (runner->next != NULL) {\n        if (runner->next->info == cur->info) {\n            struct node *del = runner->next;\n            runner->next = del->next; free(del);\n        } else runner = runner->next;\n    }\n}`,
        circular: `/* Record the original length, then use bounded nested loops. */\n/* Keep the first occurrence; unlink later matches. */\n/* When the removed node is the tail, repair tail->next = head. */`,
        doubly: `for (struct node *cur = head; cur != NULL; cur = cur->next) {\n    struct node *runner = cur->next;\n    while (runner != NULL) {\n        if (runner->info == cur->info) {\n            struct node *del = runner; runner = runner->next;\n            if (del->prev) del->prev->next = del->next;\n            if (del->next) del->next->prev = del->prev;\n            free(del);\n        } else runner = runner->next;\n    }\n}`
      },
      palindrome: {
        singly: `int len = countNodes(head);\nif (len == 0) return 1;\nint values[len]; int i = 0;\nfor (struct node *t = head; t != NULL; t = t->next)\n    values[i++] = t->info;\nfor (int a = 0, b = len - 1; a < b; a++, b--)\n    if (values[a] != values[b]) return 0;\nreturn 1;`,
        circular: `int len = countNodes(head);\nif (len == 0) return 1;\nint values[len]; int i = 0;\nif (head != NULL) {\n    struct node *t = head;\n    do { values[i++] = t->info; t = t->next; } while (t != head);\n}\nfor (int a = 0, b = len - 1; a < b; a++, b--)\n    if (values[a] != values[b]) return 0;\nreturn 1;`,
        doubly: `int len = countNodes(head);\nstruct node *left = head, *right = head;\nfor (int i = 1; i < len; i++) right = right->next;\nfor (int i = 0; i < len / 2; i++) {\n    if (left->info != right->info) return 0;\n    left = left->next; right = right->prev;\n}\nreturn 1;`
      }
    };
    if (advanced[op] && advanced[op][listType]) return advanced[op][listType];
    if (op === 'clear' && snippets.clear && snippets.clear[listType]) return snippets.clear[listType];
    return generic[op] || '/* Follow the operation trace for the pointer updates. */';
  }
  function setType(nextType) {
    if (!TYPE_INFO[nextType]) return;
    type = nextType; trace = null; stopPlayback();
    document.querySelectorAll('.structure-tab').forEach(btn => { const yes = btn.dataset.type === type; btn.classList.toggle('selected',yes); btn.setAttribute('aria-selected',String(yes)); });
    $('structureTitle').textContent = TYPE_INFO[type].title;
    updateCode(); renderGraph(nodes); renderStats(nodes); renderPointerList(null); renderTraceIdle(); renderRules();
  }
  function renderOperationList(filter='') {
    const host = $('operationGroups'); const q = filter.toLowerCase().trim(); host.innerHTML = '';
    for (const group of GROUPS) {
      const items = group.items.filter(([id,label]) => `${label} ${id} ${group.name}`.toLowerCase().includes(q));
      if (!items.length) continue;
      const block = document.createElement('div'); block.className='operation-group';
      block.innerHTML = `<div class="operation-group-title"><span>${esc(group.name)}</span><span>${items.length.toString().padStart(2,'0')}</span></div>`;
      for (const [id,label,glyph] of items) {
        const btn = document.createElement('button'); btn.type='button'; btn.className='operation-button'+(id===activeOp?' selected':''); btn.dataset.op=id;
        btn.innerHTML = `<span class="operation-glyph">${esc(glyph)}</span><span>${esc(label)}</span>${id===activeOp?'<span class="op-shortcut">ACTIVE</span>':''}`;
        btn.addEventListener('click',()=>selectOperation(id)); block.appendChild(btn);
      }
      host.appendChild(block);
    }
    if (!host.children.length) host.innerHTML = '<div class="pointer-empty">No operations match that search.</div>';
  }
  function selectOperation(op) {
    if (!OP_META[op]) return;
    activeOp=op; trace=null; stopPlayback();
    renderOperationList($('operationSearch').value);
    const cfg=OP_META[op]; $('operationTitle').textContent=cfg.title; $('operationDescription').textContent=cfg.description;
    $('operationNumber').textContent=String(Object.keys(OP_META).indexOf(op)+1).padStart(2,'0');
    renderFields(cfg.fields); $('validationMessage').textContent=''; updateCode(); renderTraceIdle(); renderPointerList(null); renderGraph(nodes); renderStats(nodes);
  }
  function renderFields(fields) {
    const holder=$('operationFields'); holder.innerHTML='';
    fields.forEach((f,i)=>{
      const wrap=document.createElement('div'); wrap.className='field-control';
      const label=document.createElement('label'); label.htmlFor=`field-${f.id}`; label.textContent=f.label;
      const input=document.createElement('input'); input.id=`field-${f.id}`; input.dataset.field=f.id; input.type='number'; input.step='1'; input.inputMode='numeric'; input.placeholder=f.placeholder; input.setAttribute('aria-label',f.label); input.autocomplete='off';
      if (f.id==='position' && activeOp==='insertAtPosition') input.value=String(nodes.length+1);
      if (f.id==='position' && activeOp==='nthFromEnd') input.value=String(Math.min(1,Math.max(1,nodes.length)));
      wrap.append(label,input); holder.appendChild(wrap);
    });
    const valueField=holder.querySelector('input'); if(valueField) valueField.focus({preventScroll:true});
  }
  function readFields() {
    const vals={};
    for(const f of OP_META[activeOp].fields){
      const el=document.querySelector(`[data-field="${f.id}"]`); const raw=el?.value.trim()??'';
      if(!raw) return {error:`Enter ${f.label.toLowerCase()}.`};
      if(!/^-?\d+$/.test(raw)) return {error:`${f.label} must be an integer.`};
      const n=Number(raw); if(!Number.isSafeInteger(n)) return {error:`${f.label} is outside the safe integer range.`}; vals[f.id]=n;
    }
    const len=nodes.length;
    if(activeOp==='insertAtPosition'&&(vals.position<1||vals.position>len+1))return {error:`Position must be from 1 to ${len+1}.`};
    if(activeOp==='deleteAtPosition'&&(vals.position<1||vals.position>len))return {error:`Position must be from 1 to ${len}.`};
    if(activeOp==='nthFromEnd'&&(vals.position<1||vals.position>len))return {error:`N must be from 1 to ${len}.`};
    if(['rotateLeft','rotateRight'].includes(activeOp)&&vals.position<0)return {error:'Rotation steps cannot be negative.'};
    return {values:vals};
  }
  function buildOperation(op, values) {
    if (!OP_META[op]) return {error:'That operation is not implemented.'};
    values = values || {};
    // Defend the engine as well as the form: no operation should dereference an
    // invalid position even if called by a test or future UI path directly.
    for (const field of OP_META[op].fields) {
      const raw = values[field.id];
      if (raw === undefined || raw === null || raw === '') return {error:`Enter ${field.label.toLowerCase()}.`};
      if (!Number.isSafeInteger(Number(raw))) return {error:`${field.label} must be an integer.`};
      values[field.id] = Number(raw);
    }
    const inputLength = nodes.length;
    if (op === 'insertAtPosition' && (values.position < 1 || values.position > inputLength + 1))
      return {error:`Position must be from 1 to ${inputLength + 1}.`};
    if (op === 'deleteAtPosition' && (values.position < 1 || values.position > inputLength))
      return {error:`Position must be from 1 to ${inputLength}.`};
    if (op === 'nthFromEnd' && (values.position < 1 || values.position > inputLength))
      return {error:`N must be from 1 to ${inputLength}.`};
    if (['rotateLeft','rotateRight'].includes(op) && values.position < 0)
      return {error:'Rotation steps cannot be negative.'};
    const before=cloneNodes(nodes); let result=cloneNodes(nodes); const steps=[]; let output=''; let mutated=OP_META[op].mutates; let extra=null;
    const step=(title,detail,code,view=result,roles={},opts={})=>pushStep(steps,title,detail,code,view,roles,opts);
    const typeLabel=TYPE_INFO[type].title.toLowerCase();
    const nullError=()=>({error:'The list is empty. Add nodes or load a sample list first.'});
    const idsIn=arr=>arr.map(n=>n.id);
    const targetIndex=(value,arr=before)=>arr.findIndex(n=>n.value===value);
    const valueSequence=arr=>arr.map(n=>n.value).join(' → ') || '∅';
    const finalStep=(title,detail,code,arr,roles={},msg='')=>{result=cloneNodes(arr); step(title,detail,code,result,roles,{output:msg,final:true});};
    const exists=before.length>0;
    const newNode=value=>makeNode(value);

    // Every trace is conceptual C pointer execution over a safely modelled node chain.
    if(['insertFront','insertEnd','insertAtPosition','insertAfter','insertBefore'].includes(op)){
      const value=values.valueA; const fresh=newNode(value); const view=cloneNodes(before);
      step('Allocate the new node',`Create a node containing ${value}. The existing ${typeLabel} is unchanged until its links are updated.`,`newNode = malloc(sizeof *newNode);\nnewNode->info = ${value};`,before,rolesAt(before,-1,{new:fresh.id}),{extraNode:fresh});
      if(op==='insertFront'){
        if(type==='circular'&&before.length===0){finalStep('Create the first circular node','With an empty circular list, the node points back to itself and becomes head.','newNode->next = newNode;\nhead = newNode;', [fresh],{new:fresh.id,head:fresh.id,tail:fresh.id},`Inserted ${value} at the front.`);}
        else if(type==='circular'){
          const oldTail=before[before.length-1]; step('Find the old tail','In a circular list, follow next until the node whose next points back to head.','while (last->next != head) last = last->next;',before,rolesAt(before,before.length-1,{new:fresh.id}));
          const after=[fresh,...before]; finalStep('Reconnect the circular links','The new node points to the old head; the old tail points to the new head.','newNode->next = head;\nlast->next = newNode;\nhead = newNode;',after,{head:fresh.id,new:fresh.id,prev:oldTail.id,tail:oldTail.id},`Inserted ${value} at the front.`);
        } else {
          step('Point new node at current head','new->next references the current first node. The old head does not move yet.',type==='doubly'?'newNode->next = head;\nnewNode->prev = NULL;':'newNode->next = head;',before,rolesAt(before,0,{new:fresh.id}),{extraNode:{...fresh,nextDescription:before.length?String(before[0].value):'NULL'}});
          const after=[fresh,...before]; finalStep('Move head to the new node',type==='doubly'?'Repair the former head’s prev pointer, then update head.':'Set head to the new node; the remaining chain stays connected.',type==='doubly'?'if (head != NULL) head->prev = newNode;\nhead = newNode;':'head = newNode;',after,{head:fresh.id,new:fresh.id,temp:before[0]?.id},`Inserted ${value} at the front.`);
        }
      } else if(op==='insertEnd'){
        if(!before.length){
          const self=type==='circular'?[fresh]:[fresh]; finalStep('Set the new head','An empty list has no tail to traverse. The new node becomes head.',type==='circular'?'head = newNode;\nnewNode->next = head;':'head = newNode;\nnewNode->next = NULL;',self,{head:fresh.id,tail:fresh.id,new:fresh.id},`Inserted ${value} into the empty list.`);
        } else {
          for(let i=0;i<before.length;i++) step(`Move temp to node ${i+1}`,`temp visits ${before[i].value}. ${i===before.length-1?'This is the tail.':'Its next link leads to another node.'}`,type==='circular'?'while (temp->next != head) temp = temp->next;':'while (temp->next != NULL) temp = temp->next;',before,rolesAt(before,i,{new:fresh.id}));
          const after=[...before,fresh]; finalStep('Link the new tail',type==='circular'?'The new tail links back to head, and the old tail links to the new node.':type==='doubly'?'Link old tail to new node in both directions.':'Set the old tail’s next pointer to the new node.',type==='circular'?'newNode->next = head;\ntemp->next = newNode;':type==='doubly'?'temp->next = newNode;\nnewNode->prev = temp;\nnewNode->next = NULL;':'newNode->next = NULL;\ntemp->next = newNode;',after,{head:before[0].id,prev:before[before.length-1].id,temp:before[before.length-1].id,new:fresh.id,tail:fresh.id},`Inserted ${value} at the end.`);
        }
      } else {
        let index;
        if(op==='insertAtPosition') index=values.position-1;
        else {const target=targetIndex(values.reference); if(target<0) return {error:`Value ${values.reference} was not found. The list was not changed.`}; index=op==='insertAfter'?target+1:target;}
        if(index===0){
          const after=[fresh,...before];
          if(type==='circular' && before.length){
            step('Find the current tail','Because the list is circular, the old tail must be redirected to the new head.','while (last->next != head) last = last->next;',before,rolesAt(before,before.length-1,{new:fresh.id}));
            finalStep('Insert and close the loop','Point the new node at the old head, link the old tail to the new node, then move head.','newNode->next = head;\nlast->next = newNode;\nhead = newNode;',after,{head:fresh.id,new:fresh.id,prev:before[before.length-1].id,tail:before[before.length-1].id},`Inserted ${value} at position 1.`);
          } else if(type==='circular') {
            finalStep('Create the first circular node','The node points to itself because it is both head and tail.','newNode->next = newNode;\nhead = newNode;',after,{head:fresh.id,new:fresh.id,tail:fresh.id},`Inserted ${value} at position 1.`);
          } else if(type==='doubly') {
            finalStep('Insert before the old head','Set newNode->prev to NULL and repair the old head’s prev pointer.','newNode->prev = NULL;\nnewNode->next = head;\nif (head) head->prev = newNode;\nhead = newNode;',after,{head:fresh.id,new:fresh.id,tail:after[after.length-1]?.id},`Inserted ${value} at position 1.`);
          } else {
            finalStep('Connect at the head','Position 1 means the new node becomes head.','newNode->next = head;\nhead = newNode;',after,{head:fresh.id,new:fresh.id,tail:after[after.length-1]?.id},`Inserted ${value} at position 1.`);
          }
        } else if(index===before.length){
          const after=[...before,fresh]; step('Reach the insertion point',`Walk to the current tail at position ${before.length}.`,type==='circular'?'while (temp->next != head) temp = temp->next;':'while (temp->next != NULL) temp = temp->next;',before,rolesAt(before,before.length-1,{new:fresh.id}));
          finalStep('Connect the new node',type==='doubly'?'Set both next and prev links.':type==='circular'?'Connect new node and preserve the loop to head.':'Connect the old tail to the new node.','temp->next = newNode;\nnewNode->next = '+(type==='circular'?'head;':'NULL;')+(type==='doubly'?'\nnewNode->prev = temp;':''),after,{head:after[0]?.id,temp:before[before.length-1]?.id,prev:before[before.length-1]?.id,new:fresh.id,tail:fresh.id},`Inserted ${value} at position ${index+1}.`);
        } else {
          const after=cloneNodes(before); after.splice(index,0,fresh); const prevNode=before[index-1], nextNode=before[index];
          step('Find the predecessor',`Stop at node ${prevNode.value}, just before the insertion point.`,`for (i = 1; i < ${index}; i++) temp = temp->next;`,before,rolesAt(before,index-1,{new:fresh.id}));
          finalStep('Reconnect neighboring nodes',type==='doubly'?'Connect newNode in both directions and repair the successor’s prev.':'Point the new node to the successor, then point the predecessor to newNode.','newNode->next = temp->next;\n'+(type==='doubly'?'newNode->prev = temp;\nif (temp->next) temp->next->prev = newNode;\n':'' )+'temp->next = newNode;',after,{head:after[0]?.id,prev:prevNode.id,temp:prevNode.id,new:fresh.id},`Inserted ${value} at position ${index+1}.`);
        }
      }
    } else if(['deleteFront','deleteEnd','deleteAtPosition','deleteByValue','deleteAllOccurrences'].includes(op)){
      if(!exists) return nullError();
      if(op==='deleteFront') step('Inspect the current head','Save the current head in temp before moving or repairing any links.','temp = head;',before,rolesAt(before,0));
      if(op==='deleteFront' && type==='circular' && before.length>1){
        for(let i=0;i<before.length;i++) step(i===before.length-1?'Reach the tail':'Find the tail before moving head',i===before.length-1?`Node ${before[i].value} is the old tail; its next link must be changed to the new head.`:`last visits ${before[i].value}; continue until last->next == head.`,'last = last->next;',before,{head:before[0].id,last:before[i].id,temp:before[0].id});
      }
      let targetIndexes=[];
      if(op==='deleteFront') targetIndexes=[0];
      if(op==='deleteEnd') targetIndexes=[before.length-1];
      if(op==='deleteAtPosition') targetIndexes=[values.position-1];
      if(op==='deleteByValue'){const ix=targetIndex(values.valueA); if(ix<0)return {error:`Value ${values.valueA} was not found. The list was not changed.`};targetIndexes=[ix];}
      if(op==='deleteAllOccurrences'){before.forEach((n,i)=>{if(n.value===values.valueA)targetIndexes.push(i);});if(!targetIndexes.length)return {error:`Value ${values.valueA} was not found. The list was not changed.`};}
      if(op==='deleteEnd'&&before.length>1){
        for(let i=0;i<before.length;i++){
          const isTail=i===before.length-1;
          const detail=type==='doubly'
            ? (isTail?`temp is at the tail (${before[i].value}); its built-in prev link identifies the predecessor.`:`temp visits ${before[i].value}; follow next to continue toward the tail.`)
            : (isTail?`temp is at the tail (${before[i].value}); prev remains at ${before[i-1].value}, and the loop stops here.`:`temp visits ${before[i].value}; prev trails one node behind.`);
          const code=isTail?(type==='circular'?'temp->next == head; /* stop */':'temp->next == NULL; /* stop */'):(type==='doubly'?'temp = temp->next;':'prev = temp;\ntemp = temp->next;');
          step(isTail?'Reach the tail':`Advance temp to node ${i+1}`,detail,code,before,rolesAt(before,i));
        }
      } else if(op==='deleteAtPosition'||op==='deleteByValue'||op==='deleteAllOccurrences'){
        const last=targetIndexes[targetIndexes.length-1];
        for(let i=0;i<=last&&i<before.length;i++)step(`Inspect node ${i+1}`,`Compare node value ${before[i].value}${targetIndexes.includes(i)?' — this node matches and will be removed.':'.'}`,`if (temp->info ${op==='deleteAtPosition'?'is at the requested position':'== '+(values.valueA??'target')}) { /* unlink */ }`,before,rolesAt(before,i));
      }
      const after=before.filter((n,i)=>!targetIndexes.includes(i));
      if(op==='deleteFront'&&before.length===1)step('Handle the only node',type==='circular'?'temp->next == head identifies the one-node loop. Set head to NULL before freeing it.':'There is no successor. Set head to NULL before freeing the node.','head = NULL;',[],{temp:before[0].id,head:before[0].id});
      if(op==='deleteEnd'&&before.length===1){
        const onlyDetail=type==='doubly'?'temp->prev is NULL, so this node is both head and tail. Clear head before freeing it.':type==='circular'?'prev stays NULL because head->next == head. Clear head before freeing the self-linked node.':'prev stays NULL because the loop never runs; this avoids dereferencing prev->next.';
        const onlyCode=type==='doubly'?'if (temp->prev == NULL) head = NULL;':'if (prev == NULL) head = NULL;';
        step('Handle the only node',onlyDetail,onlyCode,[],{temp:before[0].id,prev:null,head:before[0].id});
      }
      const removed=targetIndexes.map(i=>before[i]);
      const roles={head:after[0]?.id,tail:after[after.length-1]?.id,prev:targetIndexes[0]>0?before[targetIndexes[0]-1]?.id:null};
      const code=op==='deleteFront'?codeFor('deleteFront'):op==='deleteEnd'?codeFor('deleteEnd'):op==='deleteAtPosition'?codeFor('deleteAtPosition'):op==='deleteByValue'?'/* Find first match and predecessor. */\n/* Reconnect predecessor and successor. */\nfree(target);': '/* Unlink every match; keep prev unchanged after a deletion. */\nfree(target);';
      finalStep('Unlink and release node(s)',before.length===1?'The only node is detached. head is now NULL, then the node is freed.':type==='doubly'?'Repair both neighboring links before freeing the target.':type==='circular'?'Reconnect around the target and keep tail->next pointing to head.':'Reconnect the predecessor to the successor before freeing the target.',code,after,roles,removed.length===1?`Deleted ${removed[0].value}.`:`Deleted ${removed.length} node(s) matching ${values.valueA}.`);
    } else if(op==='search'){
      if(!exists) return nullError(); const found=[];
      before.forEach((n,i)=>{step(`Compare node ${i+1}`,`Check whether ${n.value} equals ${values.valueA}. ${n.value===values.valueA?'Match found.':'Not a match; follow next.'}`,`if (temp->info == ${values.valueA}) { /* record position */ }`,before,rolesAt(before,i));if(n.value===values.valueA)found.push(i+1);});
      finalStep('Search complete',found.length?`Found ${values.valueA} at position${found.length>1?'s':''} ${found.join(', ')}.`:`Value ${values.valueA} does not appear in this list.`, '/* traversal complete */',before,{head:before[0]?.id,temp:before[before.length-1]?.id},found.length?`Found at position(s): ${found.join(', ')}.`:`${values.valueA} not found.`);
    } else if(op==='update'){
      const ix=targetIndex(values.valueA); if(ix<0)return {error:`Value ${values.valueA} was not found. The list was not changed.`};
      for(let i=0;i<=ix;i++)step(`Inspect node ${i+1}`,`Compare ${before[i].value} with ${values.valueA}. ${i===ix?'This is the first match.':'Continue to the next node.'}`,`if (temp->info == ${values.valueA}) break;`,before,rolesAt(before,i));
      result=cloneNodes(before);result[ix].value=values.valueB;finalStep('Update node value',`Change info from ${values.valueA} to ${values.valueB}. The node and its links stay in place.`,'temp->info = newValue;',result,{head:result[0]?.id,temp:result[ix].id,tail:result[result.length-1]?.id},`Updated ${values.valueA} to ${values.valueB}.`);
    } else if(op==='count'||op==='display'){
      if(!exists){finalStep(op==='count'?'Count complete':'Display empty list',op==='count'?'An empty list has zero nodes.':'Nothing to display; head is NULL.','/* head == NULL */',[],{},op==='count'?'Node count: 0':'List is empty.');}
      else {before.forEach((n,i)=>step(op==='count'?`Count node ${i+1}`:`Visit node ${i+1}`,op==='count'?`Counter increases to ${i+1}.`:`Output ${n.value}, then follow next.`,op==='count'?'count++;':'printf("%d ", temp->info);',before,rolesAt(before,i)));finalStep(op==='count'?'Count complete':'Display complete',op==='count'?`The list contains ${before.length} node(s).`:`Displayed ${before.length} node(s) from head to tail.`,op==='count'?'return count;':'/* traversal complete */',before,{head:before[0].id,temp:before[before.length-1].id},op==='count'?`Node count: ${before.length}`:`List: ${before.map(n=>n.value).join(' → ')}${type==='circular'?' ↶ head':type==='doubly'?' (two-way)':' → NULL'}`);}
    } else if(op==='findMiddle'){
      if(!exists)return nullError();
      const ix=Math.floor(before.length/2); let slowIndex=0, fastIndex=0;
      step('Initialize slow and fast','Both pointers start at head. slow moves one link; fast moves two links per iteration.','slow = head;\nfast = head;',before,{head:before[0].id,slow:before[0].id,fast:before[0].id});
      while(fastIndex < before.length-1){
        slowIndex += 1; fastIndex += 2;
        const fastId=fastIndex < before.length ? before[fastIndex].id : null;
        step('Advance both pointers',`slow moves to ${before[slowIndex]?.value ?? 'NULL'}; fast moves two links to ${fastId===null?'NULL':before[fastIndex].value}.`,'slow = slow->next;\nfast = fast->next->next;',before,{head:before[0].id,slow:before[Math.min(slowIndex,before.length-1)]?.id,fast:fastId});
      }
      finalStep('Middle found',`Middle value: ${before[ix].value} at position ${ix+1}. For an even length, this uses the second middle.`,`/* slow points to the middle node */`,before,{head:before[0].id,slow:before[ix].id},`Middle value: ${before[ix].value} (position ${ix+1})`);
    } else if(op==='nthFromEnd'){
      if(!exists)return nullError(); const ix=before.length-values.position; const target=before[ix];
      step('Initialize two pointers',`Start fast and slow at head. First, move fast ${values.position} node(s) ahead.`,'fast = head;\nslow = head;',before,{head:before[0].id,fast:before[0].id,slow:before[0].id});
      for(let i=0;i<values.position;i++)step(`Advance fast (${i+1}/${values.position})`,`Move fast one node ahead. slow stays at ${before[0].value}.`, 'fast = fast->next;',before,{head:before[0].id,fast:i+1<before.length?before[i+1].id:null,slow:before[0].id});
      for(let i=values.position;i<before.length;i++)step('Move both pointers',`fast advances${i===before.length-1?' to NULL':''}; slow advances one node while keeping a gap of ${values.position}.`,'fast = fast->next;\nslow = slow->next;',before,{head:before[0].id,fast:i+1<before.length?before[i+1].id:null,slow:before[i-values.position+1]?.id});
      finalStep('Target from end found',`${values.position} from the end is ${target.value} at position ${ix+1}.`,'/* slow points at the requested node */',before,{head:before[0].id,slow:target.id},`${values.position} from end: ${target.value}`);
    } else if(op==='reverse'){
      const after=cloneNodes(before).reverse(); if(!exists)finalStep('Nothing to reverse','The list is empty.','head = NULL;',after,{},'List is empty; nothing changed.');else {step('Prepare pointer reversal','Each next link will be redirected to the previous node. Doubly linked nodes also swap prev and next.','prev = NULL;\ncur = head;\nnext = NULL;',before,rolesAt(before,0));for(let i=0;i<before.length;i++)step(`Reverse link ${i+1}`,`Process node ${before[i].value}. Its link direction changes as the new head is built.`,type==='doubly'?'swap(cur->prev, cur->next);':'next = cur->next;\ncur->next = prev;\nprev = cur;',before,rolesAt(before,i,{...(i>0?{prev:before[i-1].id}:{})}));finalStep('Reverse complete','The order is now reversed. Link directions are rebuilt for the selected list type.','head = prev;\n/* repair circular/doubly links */',after,{head:after[0]?.id,tail:after[after.length-1]?.id},`Reversed: ${valueSequence(after)}`);}
    } else if(op==='sort'){
      const after=cloneNodes(before).sort((a,b)=>a.value-b.value);step('Compare node values','Compare neighboring values and move smaller values toward the front.','if (left->info > right->info) swap(left->info, right->info);',before,rolesAt(before,0));finalStep('Sort complete','Values are in ascending order. Duplicate values are kept.','/* repeat comparison passes until sorted */',after,{head:after[0]?.id,tail:after[after.length-1]?.id},`Sorted: ${valueSequence(after)}`);
    } else if(op==='rotateLeft'||op==='rotateRight'){
      if(!exists)return nullError();const k=values.position%before.length;let after=cloneNodes(before);if(k){after=op==='rotateLeft'?[...before.slice(k),...before.slice(0,k)]:[...before.slice(before.length-k),...before.slice(0,before.length-k)];}step('Calculate effective rotation',`${values.position} steps becomes ${k} after taking the list length (${before.length}) into account.`,`k = steps % length;`,before,rolesAt(before,0));finalStep('Reconnect at the new head',`Move the boundary links so ${after[0].value} becomes the head.`,op==='rotateLeft'?'newTail->next = NULL;\nhead = newHead;':'newTail->next = NULL;\nhead = newHead;\n/* repair circular/doubly links as needed */',after,{head:after[0]?.id,tail:after[after.length-1]?.id,temp:before[0]?.id,prev:before[before.length-1]?.id},`${op==='rotateLeft'?'Left':'Right'} rotation by ${values.position} (${k} effective): ${valueSequence(after)}`);
    } else if(op==='removeDuplicates'){
      const seen=new Set();const after=[];for(const n of before){if(!seen.has(n.value)){seen.add(n.value);after.push(n);}}const removed=before.length-after.length;step('Scan for repeated values','Keep the first occurrence of each value. Later occurrences are unlinked and freed.','if (seen(value)) unlink_and_free(temp);',before,rolesAt(before,0));finalStep('Duplicate removal complete',removed?`Removed ${removed} duplicate node(s); first occurrences remain.`:'No duplicate values were found.','/* preserve first occurrence of each value */',after,{head:after[0]?.id,tail:after[after.length-1]?.id},removed?`Removed ${removed} duplicate(s): ${valueSequence(after)}`:'No duplicates found.');
    } else if(op==='palindrome'){
      const yes=before.every((n,i)=>n.value===before[before.length-1-i].value);for(let i=0;i<Math.ceil(before.length/2);i++)step(`Compare mirrored values`,`${before[i]?.value} ${before[i]?.value===before[before.length-1-i]?.value?'matches':'does not match'} ${before[before.length-1-i]?.value}.`,'compare left->info with right->info;',before,{head:before[0]?.id,left:before[i]?.id,right:before[before.length-1-i]?.id});finalStep('Palindrome check complete',yes?'Values read the same from both ends.':'The sequence differs when read backward.', '/* all mirrored pairs must match */',before,{head:before[0]?.id,left:before[0]?.id,right:before[before.length-1]?.id},yes?'Palindrome: YES':'Palindrome: NO');
    } else if(op==='clear'){
      if(!exists)finalStep('Already empty','head is already NULL; there are no nodes to free.','if (head == NULL) return;',[],{},'List was already empty.');else {for(let i=0;i<before.length;i++)step(`Release node ${before[i].value}`,`Visit node ${before[i].value}; keep the next address before freeing this node.`,type==='circular'?'/* break the loop first, then free each node */':'next = temp->next;\nfree(temp);',before,rolesAt(before,i));finalStep('List cleared','Every node has been released and head is NULL.','head = NULL;',[],{head:null},'List cleared.');}
    } else return {error:'That operation is not implemented.'};

    if(!steps.length) step('Operation complete','No pointer changes were needed.','/* done */',result,{}, {final:true,output});
    // Ensure the final step always reflects the computed result.
    if(!steps[steps.length-1].final){steps[steps.length-1].final=true;steps[steps.length-1].viewNodes=cloneNodes(result);steps[steps.length-1].output=output;}
    return {steps, before, result:cloneNodes(result), mutates:mutated, output:output||steps[steps.length-1].output||'', op, values};
  }
  function renderGraph(viewNodes=nodes, roles={}, extraNode=null) {
    const host=$('graphViewport');
    if(!viewNodes.length&&!extraNode){host.innerHTML='<div class="empty-graph"><div class="empty-symbol">∅</div><b>The list is empty</b><span>head = NULL · Add a node to get started.</span></div>';return;}
    const roleNames=['head','temp','prev','new','tail','last','fast','slow','left','right'];
    const buildNode=(n,i,isExtra=false)=>{
      const r=roleNames.filter(k=>roles[k]===n.id);const pills=r.map(k=>`<span class="role-pill role-${k}">${k}</span>`).join('');
      const next=viewNodes[i+1];const prev=viewNodes[i-1];let links='';
      if(type==='doubly') links=`<span>prev: ${prev?esc(prev.value):'NULL'}</span><span>next: ${next?esc(next.value):(isExtra?'pending':'NULL')}</span>`;
      else links=`<span>next: ${next?esc(next.value):(type==='circular'?(viewNodes[0]?esc(viewNodes[0].value):'SELF'):'NULL')}</span>`;
      return `<div class="node-item"><div class="node-roles">${pills||'<span class="role-pill" style="opacity:.25">node</span>'}</div><div class="node-card${r.some(k=>['temp','head','prev','left','right','fast','slow'].includes(k))?' is-active':''}${isExtra?' is-new':''}"><div class="node-value">${esc(n.value)}</div><div class="node-index">NODE ${String(i+1).padStart(2,'0')}</div></div><div class="link-details">${links}</div></div>`;
    };
    let html='<div class="node-track">';
    viewNodes.forEach((n,i)=>{
      html+=buildNode(n,i);
      if(i<viewNodes.length-1)html+=`<div class="link-arrow ${type==='doubly'?'double':''}"><small>${type==='doubly'?'PREV / NEXT':'NEXT'}</small>${type==='doubly'?'⇄':'→'}</div>`;
    });
    if(viewNodes.length){if(type==='circular')html+=`<div class="loop-back">↶ loops to ${esc(viewNodes[0].value)}</div>`;else html+=`<div class="null-end">NULL</div>`;}
    html+='</div>';
    if(extraNode&&!viewNodes.some(n=>n.id===extraNode.id))html+=`<div class="orphan-wrap"><div><div class="orphan-label">NEW NODE · NOT LINKED YET</div>${buildNode(extraNode,viewNodes.length,true)}</div></div>`;
    host.innerHTML=html;
  }
  function renderStats(view=nodes) {
    $('statNodes').textContent=view.length;
    $('statHead').textContent=view.length?view[0].value:'NULL';
    $('statTail').textContent=view.length?view[view.length-1].value:'NULL';
    $('statShape').textContent=TYPE_INFO[type].shape;
    $('graphHint').textContent=trace?(trace.committed&&trace.index<trace.steps.length-1?'Inspecting a previous step':`Step ${trace.index+1} of ${trace.steps.length}`):`${view.length} node${view.length===1?'':'s'} in memory`;
  }
  function renderPointerList(step) {
    const host=$('pointerList');
    if(!step){host.innerHTML='<div class="pointer-empty">Run an operation to inspect pointer locations.</div>';return;}
    const pointerInfo=[['head','#4767ee'],['temp','#1a9874'],['prev','#db7c44'],['new','#8b63d9'],['tail','#4767ee'],['last','#4767ee'],['fast','#4583cf'],['slow','#9a6ad8'],['left','#1a9874'],['right','#db7c44']];
    const shown=new Set();let html='';
    for(const [name,color] of pointerInfo){if(shown.has(name))continue;shown.add(name);const id=step.roles?.[name];if(id===undefined)continue;const node=(step.viewNodes||[]).find(n=>n.id===id)|| (step.extraNode?.id===id?step.extraNode:null);const val=node?node.value:'NULL';html+=`<div class="pointer-row"><span class="pointer-name"><i style="background:${color}"></i>${name}</span><span class="pointer-value">${node?`node(${esc(val)})`:'NULL'}</span></div>`;}
    if(!html)html='<div class="pointer-empty">No active pointer in this step.</div>';host.innerHTML=html;
  }
  function renderRules(){const text=TYPE_INFO[type].rule;const bullets=type==='singly'?['`head == NULL` means the list is empty.','The tail’s `next` must be NULL.','To delete the tail, keep both temp and prev.']:type==='circular'?['Empty: `head == NULL`.','One node: `head->next == head`.','Tail’s `next` must always point to head.','Never loop until NULL; a circular list has no NULL next link.']:['Head’s `prev` is NULL.','Tail’s `next` is NULL.','Every link update needs a matching reverse-link update.'];$('rulesContent').innerHTML=`<p>${esc(text)}</p><ul>${bullets.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`;}
  function updateCode(){const source=codeFor(activeOp,type);$('codeTitle').textContent=activeOp+'()';$('codeFileLabel').textContent=TYPE_INFO[type].file;$('codeContent').textContent=source;$('codeNote').textContent=({insertFront:'Core allocation and head-linking logic. Check malloc before using the returned pointer.',insertEnd:'Tail traversal differs in a circular list: stop when temp->next == head.',deleteFront:'The circular and doubly linked versions need extra links repaired.',deleteEnd:'Single-node deletion is the edge case to test first. In a circular list prev may stay NULL for one node.',insertAtPosition:'This reference shows the core splice. A production function must validate positions and handle head/append cases.',deleteAtPosition:'This reference highlights the splice. Validate bounds and handle head/tail before dereferencing.',search:'Circular lists use a do-while pattern so the head is inspected once.',count:'Circular traversal stops when temp returns to head.',display:'Circular traversal stops at head; do not use temp != NULL for a circular loop.',reverse:'Reverse operations need structure-specific link repairs; follow the trace for the selected type.',update:'This version updates the first matching value and leaves the node links unchanged.'})[activeOp]||'C reference logic for the selected operation. Review structure-specific edge cases before using as a complete lab submission.';}
  function renderTraceIdle(){ $('traceStatus').textContent='Ready to run';$('traceProgressFill').style.width='0%';$('traceStepContent').innerHTML='<div class="trace-placeholder"><span class="placeholder-icon">⌁</span><div><b>Your pointer trace starts here.</b><p>Choose an operation and press “Visualize operation” to step through its logic.</p></div></div>';$('prevStepBtn').disabled=true;$('nextStepBtn').disabled=true;$('playPauseBtn').disabled=true;$('playPauseBtn').textContent='▶ Play';$('stepCount').textContent='No active trace';$('undoBtn').disabled=history.length===0;}
  function renderCurrentTrace(){
    if(!trace){renderGraph(nodes);renderStats(nodes);renderTraceIdle();renderPointerList(null);return;}
    const s=trace.steps[trace.index];renderGraph(s.viewNodes,s.roles,s.extraNode);renderStats(s.viewNodes);renderPointerList(s);
    $('traceStatus').textContent=trace.committed?(trace.index===trace.steps.length-1?'Completed':'Trace review'): 'In progress';
    $('traceProgressFill').style.width=`${trace.steps.length<=1?100:(trace.index/(trace.steps.length-1))*100}%`;
    $('traceStepContent').innerHTML=`<div class="trace-step-card"><div class="step-index">${String(trace.index+1).padStart(2,'0')}</div><div><h4>${esc(s.title)}</h4><p>${esc(s.detail)}</p><code class="trace-code">${esc(s.code||'/* conceptual pointer step */')}</code>${s.output?`<div class="trace-output">${esc(s.output)}</div>`:''}${trace.committed&&trace.index<trace.steps.length-1?'<div class="field-hint" style="margin-top:8px">Reviewing a historical step. The final operation result is already committed.</div>':''}</div></div>`;
    $('prevStepBtn').disabled=trace.index<=0;$('nextStepBtn').disabled=trace.index>=trace.steps.length-1;$('playPauseBtn').disabled=trace.index>=trace.steps.length-1;$('stepCount').textContent=`STEP ${trace.index+1} / ${trace.steps.length}`;$('undoBtn').disabled=history.length===0;
    if(trace.index===trace.steps.length-1&&!trace.committed)commitTrace();
  }
  function commitTrace(){
    if(!trace||trace.committed)return;
    if(trace.mutates){history.push(cloneNodes(trace.before));if(history.length>30)history.shift();nodes=cloneNodes(trace.result);}
    trace.committed=true;stopPlayback();$('undoBtn').disabled=history.length===0;
    const last=trace.steps[trace.steps.length-1];if(last&&!last.output&&trace.output)last.output=trace.output;
    if(trace.mutates)renderStats(nodes);
    if(trace.output)showToast(trace.output);
  }
  function startOperation(instant=false){
    stopPlayback();
    if(trace && trace.committed && trace.index < trace.steps.length-1){ trace=null; renderGraph(nodes); renderStats(nodes); renderPointerList(null); renderTraceIdle(); }
    const parsed=readFields();if(parsed.error){$('validationMessage').textContent=parsed.error;showToast(parsed.error);return false;}$('validationMessage').textContent='';
    const result=buildOperation(activeOp,parsed.values);if(result.error){$('validationMessage').textContent=result.error;showToast(result.error);return false;}
    trace={...result,index:0,committed:false};
    if(instant){trace.index=trace.steps.length-1;commitTrace();renderGraph(nodes);renderStats(nodes);renderPointerList(trace.steps[trace.steps.length-1]);$('traceStatus').textContent='Completed';$('traceProgressFill').style.width='100%';$('traceStepContent').innerHTML=`<div class="trace-step-card"><div class="step-index">✓</div><div><h4>${esc(trace.steps[trace.steps.length-1].title)}</h4><p>${esc(trace.steps[trace.steps.length-1].detail)}</p><code class="trace-code">${esc(trace.steps[trace.steps.length-1].code||'/* done */')}</code>${trace.output?`<div class="trace-output">${esc(trace.output)}</div>`:''}</div></div>`;$('prevStepBtn').disabled=trace.steps.length<=1;$('nextStepBtn').disabled=true;$('playPauseBtn').disabled=true;$('stepCount').textContent=`STEP ${trace.steps.length} / ${trace.steps.length}`;}
    else renderCurrentTrace();
    return true;
  }
  function nextStep(){if(!trace||trace.index>=trace.steps.length-1)return;trace.index++;renderCurrentTrace();if(trace.index===trace.steps.length-1)commitTrace();}
  function previousStep(){if(!trace||trace.index<=0)return;stopPlayback();trace.index--;renderCurrentTrace();}
  function stopPlayback(){if(playTimer){clearInterval(playTimer);playTimer=null;}const b=$('playPauseBtn');if(b)b.textContent='▶ Play';}
  function togglePlayback(){if(!trace||trace.index>=trace.steps.length-1)return;if(playTimer){stopPlayback();return;}$('playPauseBtn').textContent='Ⅱ Pause';playTimer=setInterval(()=>{if(!trace||trace.index>=trace.steps.length-1){stopPlayback();return;}nextStep();},1050);}
  function showToast(message){const t=$('toast');t.textContent=message;t.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('visible'),2800);}
  function loadList(){stopPlayback();const raw=$('seedInput').value.trim();if(!raw){showToast('Enter one or more comma-separated integers.');return;}const parts=raw.split(',').map(s=>s.trim());if(parts.length>30){showToast('Limit is 30 nodes for a clear visualization.');return;}if(parts.some(s=>!/^[-+]?\d+$/.test(s)||!Number.isSafeInteger(Number(s)))){showToast('Use comma-separated safe integers, such as 10, 20, 30.');return;}const values=parts.map(Number);history.push(cloneNodes(nodes));nodes=values.map(makeNode);trace=null;renderGraph(nodes);renderStats(nodes);renderPointerList(null);renderTraceIdle();$('validationMessage').textContent='';if(activeOp==='insertAtPosition')renderFields(OP_META[activeOp].fields);showToast(`Loaded ${nodes.length} node(s).`);}
  function undo(){if(!history.length){showToast('Nothing to undo.');return;}stopPlayback();nodes=history.pop();trace=null;renderGraph(nodes);renderStats(nodes);renderPointerList(null);renderTraceIdle();$('undoBtn').disabled=history.length===0;showToast('Undid the last committed change.');}
  function reset(){stopPlayback();history=[];nodes=[makeNode(10),makeNode(20),makeNode(30)];trace=null;$('seedInput').value='10, 20, 30';renderGraph(nodes);renderStats(nodes);renderPointerList(null);renderTraceIdle();$('undoBtn').disabled=true;selectOperation('insertFront');showToast('Restored the sample list.');}
  function renderInitial(){renderOperationList();renderGraph(nodes);renderStats(nodes);renderRules();renderTraceIdle();selectOperation('insertFront');}
  document.querySelectorAll('.structure-tab').forEach(btn=>btn.addEventListener('click',()=>setType(btn.dataset.type)));
  $('operationSearch').addEventListener('input',e=>renderOperationList(e.target.value));
  $('operationForm').addEventListener('submit',e=>{e.preventDefault();startOperation(false);});
  $('quickRunBtn').addEventListener('click',()=>startOperation(true));
  $('nextStepBtn').addEventListener('click',nextStep);$('prevStepBtn').addEventListener('click',previousStep);$('playPauseBtn').addEventListener('click',togglePlayback);
  $('loadListBtn').addEventListener('click',loadList);$('seedInput').addEventListener('keydown',e=>{if(e.key==='Enter')loadList();});$('undoBtn').addEventListener('click',undo);$('resetBtn').addEventListener('click',reset);
  $('themeToggle').addEventListener('click',()=>{const isDark=document.documentElement.dataset.theme!=='dark';document.documentElement.dataset.theme=isDark?'dark':'light';$('themeToggle').textContent=isDark?'☼':'◐';});
  $('copyCodeBtn').addEventListener('click',async()=>{const content=$('codeContent').textContent;try{await navigator.clipboard.writeText(content);showToast('C reference copied.');}catch(_){const ta=document.createElement('textarea');ta.value=content;document.body.appendChild(ta);ta.select();const ok=document.execCommand('copy');ta.remove();showToast(ok?'C reference copied.':'Copy unavailable in this browser.');}});
  $('showRulesBtn').addEventListener('click',()=>{const content=$('rulesContent');const opening=content.classList.contains('hidden');content.classList.toggle('hidden',!opening);$('showRulesBtn').setAttribute('aria-expanded',String(opening));$('showRulesBtn').querySelector('span').textContent=opening?'−':'＋';});
  document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){e.preventDefault();$('operationSearch').focus();}if(e.key==='Escape'){stopPlayback();$('operationSearch').value='';renderOperationList('');}});
  renderInitial();

  // Expose a pure engine to make regression testing possible without a UI framework.
  window.NodeLabTest = {
    getOperations:()=>Object.keys(OP_META),
    setTypeForTest:t=>{if(!TYPE_INFO[t])throw Error('Unknown list type');type=t;},
    executeForTest:(op,vals,list)=>{const oldNodes=nodes,oldType=type,oldId=nextId;try{type=list?.type||type;nodes=(list?.values||[]).map(makeNode);const result=buildOperation(op,vals||{});return result.error?{error:result.error}:{result:result.result.map(n=>n.value),output:result.output,steps:result.steps.length};}finally{nodes=oldNodes;type=oldType;nextId=oldId;}},
    runRegressionSuite:()=>runRegressionSuite()
  };
  function runRegressionSuite(){
    const assertions=[];const check=(name,actual,expected)=>{const ok=JSON.stringify(actual)===JSON.stringify(expected);assertions.push({name,ok,actual,expected});};
    const run=(op,vals,input,typeName)=>{const oldNodes=nodes,oldType=type,oldId=nextId;try{type=typeName;nodes=input.map(makeNode);const r=buildOperation(op,vals);return r.error?{error:r.error}:r.result.map(n=>n.value);}finally{nodes=oldNodes;type=oldType;nextId=oldId;}};
    const runOutput=(op,vals,input,typeName)=>{const oldNodes=nodes,oldType=type,oldId=nextId;try{type=typeName;nodes=input.map(makeNode);const r=buildOperation(op,vals);return r.error?{error:r.error}:r.output;}finally{nodes=oldNodes;type=oldType;nextId=oldId;}};
    check('insert front singly',run('insertFront',{valueA:5},[10,20],'singly'),[5,10,20]);
    check('insert end circular',run('insertEnd',{valueA:30},[10,20],'circular'),[10,20,30]);
    check('insert position doubly',run('insertAtPosition',{valueA:15,position:2},[10,20],'doubly'),[10,15,20]);
    check('insert before head',run('insertBefore',{valueA:5,reference:10},[10,20],'singly'),[5,10,20]);
    check('insert after tail circular',run('insertAfter',{valueA:30,reference:20},[10,20],'circular'),[10,20,30]);
    check('delete front singleton circular',run('deleteFront',{},[10],'circular'),[]);
    check('delete end singleton singly',run('deleteEnd',{},[10],'singly'),[]);
    check('delete end multi doubly',run('deleteEnd',{},[10,20,30],'doubly'),[10,20]);
    check('delete position first',run('deleteAtPosition',{position:1},[10,20,30],'doubly'),[20,30]);
    check('delete value first duplicate',run('deleteByValue',{valueA:20},[10,20,20,30],'singly'),[10,20,30]);
    check('delete all duplicates',run('deleteAllOccurrences',{valueA:20},[20,10,20,30,20],'circular'),[10,30]);
    check('search preserves nodes',run('search',{valueA:20},[10,20,20],'doubly'),[10,20,20]);
    check('update first duplicate',run('update',{valueA:20,valueB:99},[10,20,20],'singly'),[10,99,20]);
    check('reverse circular',run('reverse',{},[10,20,30],'circular'),[30,20,10]);
    check('sort numeric',run('sort',{},[10,-3,2,2],'doubly'),[-3,2,2,10]);
    check('rotate left modulo',run('rotateLeft',{position:4},[1,2,3],'singly'),[2,3,1]);
    check('rotate right',run('rotateRight',{position:1},[1,2,3],'circular'),[3,1,2]);
    check('remove duplicates preserving first',run('removeDuplicates',{},[1,2,1,3,2],'doubly'),[1,2,3]);
    check('empty count',run('count',{},[],'singly'),[]);
    check('clear circular',run('clear',{},[1,2,3],'circular'),[]);
    check('nth from end value order',run('nthFromEnd',{position:2},[10,20,30],'singly'),[10,20,30]);
    check('missing delete returns safe error',run('deleteByValue',{valueA:99},[1,2],'singly'),{error:'Value 99 was not found. The list was not changed.'});
    check('insert front C snippet repairs doubly prev',codeFor('insertFront','doubly').includes('head->prev = newNode'),true);
    check('circular end insertion closes loop',codeFor('insertEnd','circular').includes('newNode->next = head'),true);
    check('circular traversal stops at head',codeFor('display','circular').includes('while (temp != head)'),true);
    check('doubly delete position repairs both sides',codeFor('deleteAtPosition','doubly').includes('temp->next->prev = temp->prev'),true);
    check('palindrome detects equal pair',runOutput('palindrome',{},[3,3],'singly'),'Palindrome: YES');
    check('palindrome rejects unequal pair',runOutput('palindrome',{},[3,2],'circular'),'Palindrome: NO');
    check('palindrome recognizes odd-length mirror',runOutput('palindrome',{},[1,2,1],'doubly'),'Palindrome: YES');
    return {passed:assertions.filter(a=>a.ok).length,total:assertions.length,failed:assertions.filter(a=>!a.ok)};
  }
})();
