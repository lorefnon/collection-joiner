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
    const extUsers = extend(users, self => ({
        rank: self.id.toOneOf(ranks).userId
    }))
    t.snapshot(extUsers)
    const extUsersUnwrapped = extendUnwrapped(users, self => ({
        rank: self.id.toOneOf(ranks).userId
    }))
    t.snapshot(extUsersUnwrapped)
})

test("extend with oneOrNoneOf", t => {
    const ranks = [{
        userId: 1,
        rank: "Arch Lord"
    }];
    const extUsers = extend(users, self => ({
        rank: self.id.toOneOrNoneOf(ranks).userId
    }))
    t.snapshot(extUsers)
    const extUsersUnwrapped = extendUnwrapped(users, self => ({
        rank: self.id.toOneOrNoneOf(ranks).userId
    }))
    t.snapshot(extUsersUnwrapped)
})

test("extend with manyOf", t => {
    const extUsers = extend(users, self => ({
        goldSigns: self.id.toManyOf(goldSigns).userId
    }))
    t.snapshot(extUsers)
    const extUsersUnwrapped = extendUnwrapped(users, self => ({
        goldSigns: self.id.toManyOf(goldSigns).userId
    }))
    t.snapshot(extUsersUnwrapped)
})

test("extend with multiple", t => {
    const extUsers = extend(users, self => ({
        rank: self.id.toOneOf(ranks).userId,
        elderSibling: self.elderSiblingId.toOneOrNoneOf(users).id,
        goldSigns: self.id.toManyOf(goldSigns).userId
    }))
    t.snapshot(extUsers)
    const extUsersUnwrapped = extendUnwrapped(users, self => ({
        rank: self.id.toOneOf(ranks).userId,
        elderSibling: self.elderSiblingId.toOneOrNoneOf(users).id,
        goldSigns: self.id.toManyOf(goldSigns).userId
    }))
    t.snapshot(extUsersUnwrapped)
})

