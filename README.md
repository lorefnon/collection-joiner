# collection-joiner

This is a simple type-safe utility to combine multiple collections using an intuitive association specification.

This API is reminiscent of association APIs found in ORMs, however collection-joiner is completely agnostic about how these collections are obtained, so you could for example, fetch a list of users from a database, a list of departments from another service, a list of roles from a key value store and merge them into a single hierarchy when constructing a response.

## Usage

Let's say we have following collections:

```ts
const users = [{
    id: 1,
    name: "Wei Shi Lindon",
    elderSiblingId: 3
}, {
    id: 2,
    name: "Yerin"
}, {
    id: 3,
    name: "Wei Shi Kelsa"
}];

const goldSigns = [{
    userId: 1,
    path: "Path of black flame",
    description: "Black eyes with blood-red irises"
}, {
    userId: 1,
    path: "Path of twin stars",
    description: "Blue eyes with white irises"
}, {
    userId: 2,
    path: "Path of the endless sword",
    description: "Six red metalic limbs"
}];

const ranks = [{
    userId: 1,
    rank: "Arch Lord"
}, {
    userId: 2,
    rank: "Herald"
}, {
    userId: 3,
    rank: "Low Gold"
}];
```

To derive a collection, where each user has been associated with their rank (1:1 relation), elder sibling (1:0/1 relation) and goldsigns (1:N relation), we can do:

```ts
extend(users, ext => ({
    rank: ext.oneOf(ranks, "userId", "id"),
    elderSibling: ext.oneOrNoneOf(users, "elderSiblingId", "id"),
    goldSigns: ext.manyOf(goldSigns, "userId", "id")
}))
```

This will return following structure:

```ts
    [
      {
        elderSibling: {
          value: undefined,
        },
        elderSiblingId: 3,
        goldSigns: {
          values: [
            {
              description: 'Black eyes with blood-red irises',
              path: 'Path of black flame',
              userId: 1,
            },
            {
              description: 'Blue eyes with white irises',
              path: 'Path of twin stars',
              userId: 1,
            },
          ],
        },
        id: 1,
        name: 'Wei Shi Lindon',
        rank: {
          value: {
            rank: 'Arch Lord',
            userId: 1,
          },
        },
      },
      {
        elderSibling: {
          value: undefined,
        },
        goldSigns: {
          values: [
            {
              description: 'Six red metalic limbs',
              path: 'Path of the endless sword',
              userId: 2,
            },
          ],
        },
        id: 2,
        name: 'Yerin',
        rank: {
          value: {
            rank: 'Herald',
            userId: 2,
          },
        },
      },
      {
        elderSibling: {
          value: {
            elderSiblingId: 3,
            id: 1,
            name: 'Wei Shi Lindon',
          },
        },
        goldSigns: {
          values: [],
        },
        id: 3,
        name: 'Wei Shi Kelsa',
        rank: {
          value: {
            rank: 'Low Gold',
            userId: 3,
          },
        },
      },
    ]
```

By default associated references are wrapped in `{ value: associatedOne }` and `{ values: associatedMany }` wrappers, to make it explicit to consumers whether certain association is missing or was not fetched.

You can avoid this wrapper by using `extendUnwrapped` function:

```ts
extendUnwrapped(users, ext => ({
    rank: ext.oneOf(ranks, "userId", "id"),
    elderSibling: ext.oneOrNoneOf(users, "elderSiblingId", "id"),
    goldSigns: ext.manyOf(goldSigns, "userId", "id")
}))
```

Which returns:

```ts
    [
      {
        elderSibling: undefined,
        elderSiblingId: 3,
        goldSigns: [
          {
            description: 'Black eyes with blood-red irises',
            path: 'Path of black flame',
            userId: 1,
          },
          {
            description: 'Blue eyes with white irises',
            path: 'Path of twin stars',
            userId: 1,
          },
        ],
        id: 1,
        name: 'Wei Shi Lindon',
        rank: {
          rank: 'Arch Lord',
          userId: 1,
        },
      },
      {
        elderSibling: undefined,
        goldSigns: [
          {
            description: 'Six red metalic limbs',
            path: 'Path of the endless sword',
            userId: 2,
          },
        ],
        id: 2,
        name: 'Yerin',
        rank: {
          rank: 'Herald',
          userId: 2,
        },
      },
      {
        elderSibling: {
          elderSiblingId: 3,
          id: 1,
          name: 'Wei Shi Lindon',
        },
        goldSigns: [],
        id: 3,
        name: 'Wei Shi Kelsa',
        rank: {
          rank: 'Low Gold',
          userId: 3,
        },
      },
    ]
```

