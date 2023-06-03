import test from "ava";
import { extend, extendUnwrapped } from "./index.js"

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

test("extend with oneOf", t => {
    const extUsers = extend(users, ext => ({
        rank: ext.oneOf(ranks, "userId", "id")
    }))
    t.snapshot(extUsers)
    const extUsersUnwrapped = extendUnwrapped(users, ext => ({
        rank: ext.oneOf(ranks, "userId", "id")
    }))
    t.snapshot(extUsersUnwrapped)
})

test("extend with oneOrNoneOf", t => {
    const ranks = [{
        userId: 1,
        rank: "Arch Lord"
    }];
    const extUsers = extend(users, ext => ({
        rank: ext.oneOrNoneOf(ranks, "userId", "id")
    }))
    t.snapshot(extUsers)
    const extUsersUnwrapped = extendUnwrapped(users, ext => ({
        rank: ext.oneOrNoneOf(ranks, "userId", "id")
    }))
    t.snapshot(extUsersUnwrapped)
})

test("extend with manyOf", t => {
    const extUsers = extend(users, ext => ({
        goldSigns: ext.manyOf(goldSigns, "userId", "id")
    }))
    t.snapshot(extUsers)
    const extUsersUnwrapped = extendUnwrapped(users, ext => ({
        goldSigns: ext.manyOf(goldSigns, "userId", "id")
    }))
    t.snapshot(extUsersUnwrapped)
})

test("extend with multiple", t => {
    const extUsers = extend(users, ext => ({
        rank: ext.oneOf(ranks, "userId", "id"),
        elderSibling: ext.oneOrNoneOf(users, "elderSiblingId", "id"),
        goldSigns: ext.manyOf(goldSigns, "userId", "id")
    }))
    t.snapshot(extUsers)
    const extUsersUnwrapped = extendUnwrapped(users, ext => ({
        rank: ext.oneOf(ranks, "userId", "id"),
        elderSibling: ext.oneOrNoneOf(users, "id", "elderSiblingId"),
        goldSigns: ext.manyOf(goldSigns, "userId", "id")
    }))
    t.snapshot(extUsersUnwrapped)
})

