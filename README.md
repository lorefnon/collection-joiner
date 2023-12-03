# collection-joiner

When developing APIs or writing integration solutions, we often fetch data from multiple sources and combine them together. 
This requires quite a bit of boilerplate even if you use utility libraries like lodash.

This library aims to be provide a simple type-safe utility that makes the task of combining multiple collections simpler using an intuitive association API.

You may find this API to be reminiscent of association APIs found in ORMs. However, collection-joiner is completely agnostic about 
how these collections are obtained - so you could for example, fetch a list of users from a database, 
a list of departments from another service, a list of roles from a key value store and merge them into a single hierarchy when constructing a response.

## Usage/Examples

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

To create a merged collection, where each user has been associated with their rank (1:1 relation), elder sibling (1:0/1 relation) and goldsigns (1:N relation), we can do:

```ts
import { extend } from "@lorefnon/collection-joiner";

extend(users, ({ link, own }) => ({
    // Populate rank by associating id of user to userId of ranks
    rank: link(own.id).toOneOf(ranks, rank => rank.userId),
    // Populate elderSibling by associating elderSiblingId of user to id of user
    elderSibling: link(own.elderSiblingId).toOneOrNoneOf(users, user => user.id),
    // Populate goldSigns by associating id of user to userId of goldSigns
    goldSigns: link(own.id).toManyOf(goldSigns, gs => gs.userId)
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

You can avoid this wrapper by using `.unwrap()`:

```ts
import { extend } from "@lorefnon/collection-joiner";

extend(users, ({ link, own }) => ({
      rank: link(own.id).toOneOf(ranks, r => r.userId).unwrap(),
      elderSibling: link(own.elderSiblingId).toOneOrNoneOf(users, u => u.id).unwrap(),
      goldSigns: link(own.id).toManyOf(goldSigns, gs => gs.userId).unwrap()
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

We don't really recommend using this, until you need to conform to a type that you don't control.

### Extend mutating original collection:

By default, extend will leave the collection provided as input as is, and return a new collection. However, you can pass `mutate: true` option to update the collection in place. This may be useful if you are dealing with reactive collections (eg. vue) or building object graphs through multiple invocations of `extend`

```ts
const extendedUsers = extend(users, ({ link, own }) => ({
    // Populate rank by associating id of user to userId of ranks
    rank: link(own.id).toOneOf(ranks, r => r.userId),
    // Populate elderSibling by associating elderSiblingId of user to userId of ranks
    elderSibling: link(own.elderSiblingId).toOneOrNoneOf(users, u => u.id),
    // Populate goldSigns by associating id of user to userId of goldSigns
    goldSigns: link(own.id).toManyOf(goldSigns, gs => gs.userId)
}), { mutate: true })

extendedUsers === users // true
```

### Fetching collections

While data fetching is not the primary goal of this utility, for convenience we support a `extendAsync` utility as well which can accept async functions or thunks which resolve to collections.

```ts
import { extendAsync } from "@lorefnon/collection-joiner";

const fetchRanks = async () => {
    // Fetch ranks from database...
    return [{ userId: 1, rank: "Arch Lord" }];
};

await extendAsync(users, ({ link, own }) => ({
    // Populate rank by associating id of user to userId of ranks
    rank: link(own.id)
      // Async function that resolves to collection is acceptable
      .toOneOf(fetchRanks, rank => rank.userId)
      .if(() => /* If client is asking for rank */ true),

    // Populate elderSibling by associating elderSiblingId of user to id of user
    elderSibling: link(own.elderSiblingId)
      // If the operation has already started, promise is also acceptable
      .toOneOrNoneOf(Promise.resolve(users), user => user.id),
}))
```

If passing thunks defined inline, we need to exercise caution if multiple relations are using the same data source.

For example: 

```ts
const extUsers = await extendAsync(users, async ({ own, link }) => ({
  elderSibling: link(own.elderSiblingId)
      .toOneOrNoneOf(
        async () => (await fetch("/family/1/users")).json(), 
        it => it.id
      )
      .if(() => linkSiblings),
  parents: link(own.parentIds)
      .toManyOf(
        async () => (await fetch("/family/1/users")).json(), 
        it => it.id
      ),
}));
```

The users will be fetched twice, because even though we are making the same request for multiple associations, the library
the does not have a good way to infer that.

Instead we can extract out the fetcher and reuse that: 

```ts
const fetchUsers = async () => (await fetch("/family/1/users")).json();

const extUsers = await extendAsync(users, async ({ own, link }) => ({
  elderSibling: link(own.elderSiblingId)
      .toOneOrNoneOf(
        fetchUsers, 
        it => it.id
      )
      .if(() => linkSiblings),
  parents: link(own.parentIds)
      .toManyOf(
        fetchUsers,
        it => it.id
      ),
}));
```

Now, users will be fetched only once because the library is smart enough to detect that identity of the fetcher functions is same.

Note that this duplication support is not a substitute for caching. This library does not keep track of results, separate extendAsync calls will perform separate requests.

A lower level `fetchAll` utility is also available, when it is desirable to have fetching and merging as separate steps. This can be
useful for example if in same request multiple collections are available, which we then want to merge together.

```ts
const extUsers = await extendAsync(users, async ({ own, link }) => {
    // Fetch users and ranks in parallel
    const rels = await fetchAll({
        ranks: {
            // fetch ranks 
            fetch: async () => ranks,
            // A guard can be passed to indicate if the collection needs to be fetched
            //
            // This is convenient for example, if based on user provided parameters we
            // need to decide if ranks are needed or not
            if: () => true
        },

        // When guards are not needed, it is sufficient to just pass
        // a fetcher function
        users: async () => users,
    })

    // Results are available in an object which mirrors the shape of request
    // rels: { ranks?: Rank[], users: User[] }

    // Now we can use the fetched collections for merging
    return {
        rank: link(own.id)
            .toOneOf(rels.ranks ?? [], it => it.userId)
            .if(() => linkRanks),
        elderSibling: link(own.elderSiblingId)
            .toOneOrNoneOf(rels.users, it => it.id)
            .if(() => linkSiblings),
        goldSigns: link(own.id)
            .toManyOf(async () => goldSigns, it => it.userId),
        loveInterests: link(own.loveInterestIds)
            .toManyOf(rels.users, it => it.id),
        parents: link(own.parentIds)
            .toManyOf(rels.users, it => it.id),
    }
});
```

Of course, `fetchAll` is a generic utility. We can use it independent of `extend`/`extendAsync` too.

# License

MIT
