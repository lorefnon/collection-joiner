# collection-joiner

A simple type-safe utility to combine multiple collections using an intuitive proxy-based association API.

You may find this API to be reminiscent of association APIs found in ORMs. However, collection-joiner is completely agnostic about how these collections are obtained - so you could for example, fetch a list of users from a database, a list of departments from another service, a list of roles from a key value store and merge them into a single hierarchy when constructing a response.

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
import { extend } from "@lorefnon/collection-joiner";

extend(users, self => ({
    // Populate rank by associating id of user to userId of ranks
    rank: self.id.toOneOf(ranks).userId,
    // Populate elderSibling by associating elderSiblingId of user to userId of ranks
    elderSibling: self.elderSiblingId.toOneOrNoneOf(users).id,
    // Populate goldSigns by associating id of user to userId of goldSigns
    goldSigns: self.id.toManyOf(goldSigns).userId
}))
```

This will return following structure:

```ts
    [
      {
        // user:
        id: 1,
        name: 'Wei Shi Lindon',
        rank: {
          value: {
            rank: 'Arch Lord',
            userId: 1,
          },
        },
        elderSiblingId: 3,

        // Associated collections:

        // 1:1 Association:
        elderSibling: {
          value: {
            id: 3,
            name: 'Wei Shi Kelsa',
          },
        },

        // 1:N Association:
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
      },
      {
        id: 2,
        name: 'Yerin',
        rank: {
          value: {
            rank: 'Herald',
            userId: 2,
          },
        },
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
      },
      {
        id: 3,
        name: 'Wei Shi Kelsa',
        rank: {
          value: {
            rank: 'Low Gold',
            userId: 3,
          },
        },
        elderSibling: {
          value: undefined,
        },
        goldSigns: {
          values: [],
        },
      },
    ]
```

By default associated references are wrapped in `{ value: associatedOne }` and `{ values: associatedMany }` wrappers, to make it explicit to consumers whether certain association is missing or was not fetched.

You can avoid this wrapper by using `extendUnwrapped` function:

```ts
import { extendUnwrapped } from "@lorefnon/collection-joiner";

extendUnwrapped(users, self => ({
      rank: self.id.toOneOf(ranks).userId,
      elderSibling: self.elderSiblingId.toOneOrNoneOf(users).id,
      goldSigns: self.id.toManyOf(goldSigns).userId
}))
```

Which returns:

```ts
   [
      {
        elderSibling: {
          id: 3,
          name: 'Wei Shi Kelsa',
        },
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
        elderSibling: undefined,
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

# License

MIT

# History

This project was developed as part of `TS Workshop: Power of Mapped Types` organized by OptimalWeb group in Hyderabad, Telangana.