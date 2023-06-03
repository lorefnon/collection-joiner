import test from "ava";
import { extend } from "./index.js"

test("extend with oneOf", t => {
    const users = [{
        id: 1,
        name: "Wei Shi Lindon"
    }, {
        id: 2,
        name: "Yerin"
    }];
    const ranks = [{
        userId: 1,
        rank: "Arch Lord"
    }, {
        userId: 2,
        rank: "Herald"
    }];
    const extUsers = extend(users, ext => ({
        rank: ext.oneOf(ranks, "userId", "id")
    }))
    t.snapshot(extUsers)
})

test("extend with oneOrNoneOf", t => {
    const users = [{
        id: 1,
        name: "Wei Shi Lindon"
    }, {
        id: 2,
        name: "Yerin"
    }];
    const ranks = [{
        userId: 1,
        rank: "Arch Lord"
    }];
    const extUsers = extend(users, ext => ({
        rank: ext.oneOrNoneOf(ranks, "userId", "id")
    }))
    t.snapshot(extUsers)
})

test("extend with manyOf", t => {
    const users = [{
        id: 1,
        name: "Wei Shi Lindon"
    }, {
        id: 2,
        name: "Yerin"
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
    const extUsers = extend(users, ext => ({
        goldSigns: ext.manyOf(goldSigns, "userId", "id")
    }))
    t.snapshot(extUsers)
})

