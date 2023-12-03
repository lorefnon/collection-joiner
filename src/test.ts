import isEqual from 'lodash/isEqual.js';
import test from "ava";
import { MaybeN, extend, fetchAll } from "./index.js"
import isUndefined from 'lodash/isUndefined.js';

interface User {
    id: number;
    name: string;
    elderSiblingId?: number;
    loveInterestIds?: number[],
    parentIds?: number[]
}

const getData = () => {
    const users: User[] = [{
        id: 1,
        name: "Wei Shi Lindon",
        elderSiblingId: 3,
        loveInterestIds: [2],
        parentIds: [4, 5],
    }, {
        id: 2,
        name: "Yerin"
    }, {
        id: 3,
        name: "Wei Shi Kelsa"
    }, {
        id: 4,
        name: "Wei Shi Jaren"
    }, {
        id: 5,
        name: "Wei Shi Seisha"
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
    }, {
        userId: 4,
        rank: "Jade"
    }, {
        userId: 5,
        rank: "Jade"
    }];

    return { users, ranks, goldSigns }
}

[undefined, false, true].forEach((mutate) => {
    const withMutationDesc = mutate == null
        ? ''
        : ' ' + (mutate ? 'with' : 'without') + ' mutation';

    const opts = { mutate }

    test(`extend with oneOf${withMutationDesc}`, t => {
        const { users, ranks } = getData()
        const extUsers = extend(users, ({ link, own }) => ({
            rank: link(own.id).toOneOf(ranks, r => r.userId)
        }), opts)
        t.snapshot(extUsers)
        t.assert((extUsers === users) === !!mutate)
        t.assert((extUsers[0] === users[0]) === !!mutate)

        const extUsersUnwrapped = extend(users, ({ link, own }) => ({
            rank: link(own.id).toOneOf(ranks, r => r.userId).unwrap()
        }), opts)
        t.snapshot(extUsersUnwrapped)
        t.assert((extUsersUnwrapped === users) === !!mutate)
        t.assert((extUsersUnwrapped[0] === users[0]) === !!mutate)
    })

    test(`extend with oneOrNoneOf${withMutationDesc}`, t => {
        const { users } = getData()
        const ranks = [{
            userId: 1,
            rank: "Arch Lord"
        }];
        const extUsers = extend(users, ({ link, own }) => ({
            rank: link(own.id).toOneOrNoneOf(ranks, r => r.userId)
        }), opts)
        t.snapshot(extUsers)
        t.assert((extUsers === users) === !!mutate)
        t.assert((extUsers[0] === users[0]) === !!mutate)

        const extUsersUnwrapped = extend(users, ({ link, own }) => ({
            rank: link(own.id).toOneOrNoneOf(ranks, r => r.userId).unwrap()
        }), opts)
        t.snapshot(extUsersUnwrapped)
        t.assert((extUsersUnwrapped === users) === !!mutate)
        t.assert((extUsersUnwrapped[0] === users[0]) === !!mutate)
    })

    test(`extend with manyOf${withMutationDesc}`, t => {
        const { users, goldSigns } = getData()
        const extUsers = extend(users, ({ own, link }) => ({
            goldSigns: link(own.id).toManyOf(goldSigns, gs => gs.userId)
        }), opts)
        t.snapshot(extUsers)
        t.assert((extUsers === users) === !!mutate)
        t.assert((extUsers[0] === users[0]) === !!mutate)

        const extUsersUnwrapped = extend(users, ({ own, link }) => ({
            goldSigns: link(own.id).toManyOf(goldSigns, gs => gs.userId).unwrap()
        }), opts)
        t.snapshot(extUsersUnwrapped)
        t.assert((extUsersUnwrapped === users) === !!mutate)
        t.assert((extUsersUnwrapped[0] === users[0]) === !!mutate)
    })

    test(`extend with manyOf with array${withMutationDesc}`, t => {
        const { users } = getData()
        const extUsers = extend(users, ({ link, own }) => ({
            loveInterests: link(own.loveInterestIds).toManyOf(users, u => u.id),
            prospectiveLoveInterests: link(own.id).toManyOf(users, u => u.loveInterestIds),
            parents: link(own.parentIds).toManyOf(users, u => u.id),
        }), opts)
        t.snapshot(extUsers)
        t.assert((extUsers === users) === !!mutate)
        t.assert((extUsers[0] === users[0]) === !!mutate)

        const extUsersUnwrapped = extend(users, ({ link, own }) => ({
            loveInterests: link(own.loveInterestIds).toManyOf(users, u => u.id).unwrap(),
            prospectiveLoveInterests: link(own.id).toManyOf(users, u => u.loveInterestIds).unwrap(),
            parents: link(own.parentIds).toManyOf(users, u => u.id).unwrap(),
        }), opts)
        t.snapshot(extUsersUnwrapped)
        t.assert((extUsersUnwrapped === users) === !!mutate)
        t.assert((extUsersUnwrapped[0] === users[0]) === !!mutate)
    })

    test(`extend with multiple${withMutationDesc}`, t => {
        const { users, ranks, goldSigns } = getData()
        const extUsersArr = [opts, undefined].map(opts => extend(users, ({ link, own }) => ({
            rank: link(own.id).toOneOf(ranks, it => it.userId),
            elderSibling: link(own.elderSiblingId).toOneOrNoneOf(users, it => it.id),
            goldSigns: link(own.id).toManyOf(goldSigns, it => it.userId),
            loveInterests: link(own.loveInterestIds).toManyOf(users, it => it.id),
            parents: link(own.parentIds).toManyOf(users, it => it.id),
        }), opts))
        t.assert(isEqual(extUsersArr[0], extUsersArr[1]))
        const [extUsers] = extUsersArr
        t.snapshot(extUsersArr)
        t.assert(extUsers[0].goldSigns.values[0].userId === extUsers[0].id)
        t.assert((extUsers === users) === !!mutate)
        t.assert((extUsers[0] === users[0]) === !!mutate)

        const extUsersUnwrappedArr = [opts, undefined].map(opts => extend(users, ({ link, own }) => ({
            rank: link(own.id).toOneOf(ranks, it => it.userId).unwrap(),
            elderSibling: link(own.elderSiblingId).toOneOrNoneOf(users, it => it.id).unwrap(),
            goldSigns: link(own.id).toManyOf(goldSigns, it => it.userId).unwrap(),
            loveInterests: link(own.loveInterestIds).toManyOf(users, it => it.id).unwrap(),
            parents: link(own.parentIds).toManyOf(users, it => it.id).unwrap(),
        }), opts))
        t.assert(isEqual(extUsersUnwrappedArr[0], extUsersUnwrappedArr[1]))
        const [extUsersUnwrapped] = extUsersUnwrappedArr
        t.snapshot(extUsersUnwrapped)
        t.assert((extUsersUnwrapped === users) === !!mutate)
        t.assert((extUsersUnwrapped[0] === users[0]) === !!mutate)
    })

    test(`extend with transformations${withMutationDesc}`, t => {
        const { users, ranks, goldSigns } = getData()
        const extUsersArr = [opts, undefined].map(opts => extend(users, ({ link, own }) => ({
            rank: link(own.id)
                .toOneOf(ranks, it => it.userId)
                .thru(it => it.rank),
            elderSibling: link(own.elderSiblingId)
                .toOneOrNoneOf(users, it => it.id)
                .thru(it => it?.name),
            goldSigns: link(own.id)
                .toManyOf(goldSigns, it => it.userId)
                .thru(linked => linked.map(it => ({
                    path: it.path,
                    description: it.description
                }))),
            loveInterests: link(own.loveInterestIds)
                .toManyOf(users, it => it.id)
                .thru(linked => ({
                    type: "LoveInterest",
                    ...linked
                })),
            parents: link(own.parentIds)
                .toManyOf(users, it => it.id),
        }), opts))
        t.assert(isEqual(extUsersArr[0], extUsersArr[1]))
        const [extUsers] = extUsersArr
        t.snapshot(extUsersArr)
        t.assert((extUsers === users) === !!mutate)
        t.assert((extUsers[0] === users[0]) === !!mutate)

        const extUsersUnwrappedArr = [opts, undefined].map(opts => extend(users, ({ link, own }) => ({
            rank: link(own.id)
                .toOneOf(ranks, it => it.userId)
                .thru(it => it.rank)
                .unwrap(),
            elderSibling: link(own.elderSiblingId)
                .toOneOrNoneOf(users, it => it.id)
                .thru(it => it?.name)
                .unwrap(),
            goldSigns: link(own.id)
                .toManyOf(goldSigns, it => it.userId)
                .thru(linked => linked.map(it => ({
                    path: it.path,
                    description: it.description
                })))
                .unwrap(),
            loveInterests: link(own.loveInterestIds)
                .toManyOf(users, it => it.id)
                .thru(linked => ({
                    type: "LoveInterest",
                    ...linked
                }))
                .unwrap(),
            parents: link(own.parentIds)
                .toManyOf(users, it => it.id)
                .unwrap(),
        }), opts))
        t.assert(isEqual(extUsersUnwrappedArr[0], extUsersUnwrappedArr[1]))
        const [extUsersUnwrapped] = extUsersUnwrappedArr
        t.snapshot(extUsersUnwrapped)
        t.assert((extUsersUnwrapped === users) === !!mutate)
        t.assert((extUsersUnwrapped[0] === users[0]) === !!mutate)
    })

    test(`extend with multiple nullable${withMutationDesc}`, t => {
        const data = getData()
        const users: undefined | typeof data.users = data.users
        const ranks: null | typeof data.ranks = data.ranks
        const goldSigns: MaybeN<typeof data.goldSigns> = data.goldSigns

        const extUsersArr = [opts, undefined].map(opts => extend(users, ({ own, link }) => ({
            rank: link(own.id).toOneOf(ranks, it => it.userId),
            elderSibling: link(own.elderSiblingId).toOneOrNoneOf(users, it => it.id),
            goldSigns: link(own.id).toManyOf(goldSigns, it => it.userId),
            loveInterests: link(own.loveInterestIds).toManyOf(users, it => it.id),
            parents: link(own.parentIds).toManyOf(users, it => it.id),
        }), opts))
        t.assert(isEqual(extUsersArr[0], extUsersArr[1]))
        const [extUsers] = extUsersArr
        t.assert(extUsers[0].goldSigns?.values[0].userId === extUsers[0].id)
        t.snapshot(extUsersArr)
        t.assert((extUsers === users) === !!mutate)
        t.assert((extUsers[0] === users[0]) === !!mutate)

        const extUsersUnwrappedArr = [opts, undefined].map(opts => extend(users, ({ own, link }) => ({
            rank: link(own.id).toOneOf(ranks, it => it.userId).unwrap(),
            elderSibling: link(own.elderSiblingId).toOneOrNoneOf(users, it => it.id).unwrap(),
            goldSigns: link(own.id).toManyOf(goldSigns, it => it.userId).unwrap(),
            loveInterests: link(own.loveInterestIds).toManyOf(users, it => it.id).unwrap(),
            parents: link(own.parentIds).toManyOf(users, it => it.id).unwrap(),
        }), opts))
        t.assert(isEqual(extUsersUnwrappedArr[0], extUsersUnwrappedArr[1]))
        const [extUsersUnwrapped] = extUsersUnwrappedArr
        t.snapshot(extUsersUnwrapped)
        t.assert((extUsersUnwrapped === users) === !!mutate)
        t.assert((extUsersUnwrapped[0] === users[0]) === !!mutate)
    })
})

test('fetchAll', async (t) => {
    const res = await fetchAll({
        users: {
            fetch: async () => [{ name: 'lorefnon' }],
            if: () => true
        },
        departments: {
            fetch: async () => [{ name: "magic" }, { name: "necromancy" }],
            if: async () => true
        },
        events: {
            fetch: async () => [{ date: new Date() }],
            if: () => false
        }
    });
    t.snapshot(res)
})

test('conditional extend', async (t) => {
    const data = getData()
    const users: undefined | typeof data.users = data.users
    const ranks: null | typeof data.ranks = data.ranks
    const goldSigns: MaybeN<typeof data.goldSigns> = data.goldSigns

    const linkRanks = true;
    const linkSiblings = false;

    const extUsers= extend(users, ({ own, link }) => ({
        rank: link(own.id)
            .toOneOf(ranks, it => it.userId)
            .if(() => linkRanks),
        elderSibling: link(own.elderSiblingId)
            .toOneOrNoneOf(users, it => it.id)
            .if(() => linkSiblings),
        goldSigns: link(own.id)
            .toManyOf(goldSigns, it => it.userId),
        loveInterests: link(own.loveInterestIds)
            .toManyOf(users, it => it.id),
        parents: link(own.parentIds)
            .toManyOf(users, it => it.id),
    }));
    
    t.snapshot(extUsers)

    t.assert(isUndefined(extUsers[0].elderSibling));
    t.assert(extUsers[0].rank?.value?.rank === "Arch Lord");
    t.assert(extUsers[0].goldSigns?.values[0].userId === extUsers[0].id);
})
