import isEqual from 'lodash/isEqual.js';
import test from "ava";
import { extend, extendUnwrapped } from "./index.js"

const getData = () => {
    const users = [{
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
        const extUsers = extend(users, own => ({
            rank: own.id.toOneOf(ranks).userId
        }), opts)
        t.snapshot(extUsers)
        t.assert((extUsers === users) === !!mutate)
        t.assert((extUsers[0] === users[0]) === !!mutate)

        const extUsersUnwrapped = extendUnwrapped(users, own => ({
            rank: own.id.toOneOf(ranks).userId
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
        const extUsers = extend(users, own => ({
            rank: own.id.toOneOrNoneOf(ranks).userId
        }), opts)
        t.snapshot(extUsers)
        t.assert((extUsers === users) === !!mutate)
        t.assert((extUsers[0] === users[0]) === !!mutate)

        const extUsersUnwrapped = extendUnwrapped(users, own => ({
            rank: own.id.toOneOrNoneOf(ranks).userId
        }), opts)
        t.snapshot(extUsersUnwrapped)
        t.assert((extUsersUnwrapped === users) === !!mutate)
        t.assert((extUsersUnwrapped[0] === users[0]) === !!mutate)
    })

    test(`extend with manyOf${withMutationDesc}`, t => {
        const { users, goldSigns } = getData()
        const extUsers = extend(users, own => ({
            goldSigns: own.id.toManyOf(goldSigns).userId
        }), opts)
        t.snapshot(extUsers)
        t.assert((extUsers === users) === !!mutate)
        t.assert((extUsers[0] === users[0]) === !!mutate)

        const extUsersUnwrapped = extendUnwrapped(users, own => ({
            goldSigns: own.id.toManyOf(goldSigns).userId
        }), opts)
        t.snapshot(extUsersUnwrapped)
        t.assert((extUsersUnwrapped === users) === !!mutate)
        t.assert((extUsersUnwrapped[0] === users[0]) === !!mutate)
    })

    test(`extend with manyOf with array${withMutationDesc}`, t => {
        const { users } = getData()
        const extUsers = extend(users, own => ({
            loveInterests: own.loveInterestIds.toManyOf(users).id,
            prospectiveLoveInterests: own.id.toManyOf(users).loveInterestIds,
            parents: own.parentIds.toManyOf(users).id,
        }), opts)
        t.snapshot(extUsers)
        t.assert((extUsers === users) === !!mutate)
        t.assert((extUsers[0] === users[0]) === !!mutate)

        const extUsersUnwrapped = extendUnwrapped(users, own => ({
            loveInterests: own.loveInterestIds.toManyOf(users).id,
            prospectiveLoveInterests: own.id.toManyOf(users).loveInterestIds,
            parents: own.parentIds.toManyOf(users).id,
        }), opts)
        t.snapshot(extUsersUnwrapped)
        t.assert((extUsersUnwrapped === users) === !!mutate)
        t.assert((extUsersUnwrapped[0] === users[0]) === !!mutate)
    })

    test(`extend with multiple${withMutationDesc}`, t => {
        const { users, ranks, goldSigns } = getData()
        const extUsersArr = [opts, undefined].map(opts => extend(users, own => ({
            rank: own.id.toOneOf(ranks).userId,
            elderSibling: own.elderSiblingId.toOneOrNoneOf(users).id,
            goldSigns: own.id.toManyOf(goldSigns).userId,
            loveInterests: own.loveInterestIds.toManyOf(users).id,
            parents: own.parentIds.toManyOf(users).id,
        }), opts))
        t.assert(isEqual(extUsersArr[0], extUsersArr[1]))
        const [extUsers] = extUsersArr
        t.snapshot(extUsersArr)
        t.assert((extUsers === users) === !!mutate)
        t.assert((extUsers[0] === users[0]) === !!mutate)

        const extUsersUnwrappedArr = [opts, undefined].map(opts => extendUnwrapped(users, own => ({
            rank: own.id.toOneOf(ranks).userId,
            elderSibling: own.elderSiblingId.toOneOrNoneOf(users).id,
            goldSigns: own.id.toManyOf(goldSigns).userId,
            loveInterests: own.loveInterestIds.toManyOf(users).id,
            parents: own.parentIds.toManyOf(users).id,
        }), opts))
        t.assert(isEqual(extUsersUnwrappedArr[0], extUsersUnwrappedArr[1]))
        const [extUsersUnwrapped] = extUsersUnwrappedArr
        t.snapshot(extUsersUnwrapped)
        t.assert((extUsersUnwrapped === users) === !!mutate)
        t.assert((extUsersUnwrapped[0] === users[0]) === !!mutate)
    })
})

