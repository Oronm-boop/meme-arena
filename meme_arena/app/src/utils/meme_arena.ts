/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/meme_arena.json`.
 */
export type MemeArena = {
    "address": "3SFNAgqxdxamXWyn5CbQ5pJ9L27nE1dm8iFY1sBnpQMC",
    "metadata": {
        "name": "memeArena",
        "version": "0.1.0",
        "spec": "0.1.0",
        "description": "Created with Anchor"
    },
    "instructions": [
        {
            "name": "claimReward",
            "discriminator": [
                149,
                95,
                181,
                242,
                94,
                90,
                158,
                162
            ],
            "accounts": [
                {
                    "name": "game",
                    "writable": true,
                    "relations": [
                        "bet"
                    ]
                },
                {
                    "name": "bet",
                    "writable": true,
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const",
                                "value": [
                                    98,
                                    101,
                                    116
                                ]
                            },
                            {
                                "kind": "account",
                                "path": "game"
                            },
                            {
                                "kind": "account",
                                "path": "user"
                            }
                        ]
                    }
                },
                {
                    "name": "vault",
                    "writable": true,
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const",
                                "value": [
                                    118,
                                    97,
                                    117,
                                    108,
                                    116
                                ]
                            },
                            {
                                "kind": "account",
                                "path": "game"
                            }
                        ]
                    }
                },
                {
                    "name": "user",
                    "writable": true,
                    "signer": true,
                    "relations": [
                        "bet"
                    ]
                },
                {
                    "name": "systemProgram",
                    "address": "11111111111111111111111111111111"
                }
            ],
            "args": []
        },
        {
            "name": "initializeGame",
            "discriminator": [
                44,
                62,
                102,
                247,
                126,
                208,
                130,
                215
            ],
            "accounts": [
                {
                    "name": "game",
                    "writable": true,
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const",
                                "value": [
                                    103,
                                    97,
                                    109,
                                    101
                                ]
                            },
                            {
                                "kind": "arg",
                                "path": "topic"
                            }
                        ]
                    }
                },
                {
                    "name": "vault",
                    "writable": true,
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const",
                                "value": [
                                    118,
                                    97,
                                    117,
                                    108,
                                    116
                                ]
                            },
                            {
                                "kind": "account",
                                "path": "game"
                            }
                        ]
                    }
                },
                {
                    "name": "authority",
                    "writable": true,
                    "signer": true
                },
                {
                    "name": "systemProgram",
                    "address": "11111111111111111111111111111111"
                }
            ],
            "args": [
                {
                    "name": "topic",
                    "type": "string"
                },
                {
                    "name": "deadline",
                    "type": "i64"
                }
            ]
        },
        {
            "name": "placeBet",
            "discriminator": [
                222,
                62,
                67,
                220,
                63,
                166,
                126,
                33
            ],
            "accounts": [
                {
                    "name": "game",
                    "writable": true
                },
                {
                    "name": "bet",
                    "writable": true,
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const",
                                "value": [
                                    98,
                                    101,
                                    116
                                ]
                            },
                            {
                                "kind": "account",
                                "path": "game"
                            },
                            {
                                "kind": "account",
                                "path": "user"
                            }
                        ]
                    }
                },
                {
                    "name": "vault",
                    "writable": true,
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const",
                                "value": [
                                    118,
                                    97,
                                    117,
                                    108,
                                    116
                                ]
                            },
                            {
                                "kind": "account",
                                "path": "game"
                            }
                        ]
                    }
                },
                {
                    "name": "user",
                    "writable": true,
                    "signer": true
                },
                {
                    "name": "systemProgram",
                    "address": "11111111111111111111111111111111"
                }
            ],
            "args": [
                {
                    "name": "side",
                    "type": {
                        "defined": {
                            "name": "side"
                        }
                    }
                },
                {
                    "name": "amount",
                    "type": "u64"
                }
            ]
        },
        {
            "name": "settleGame",
            "discriminator": [
                96,
                54,
                24,
                189,
                239,
                198,
                86,
                29
            ],
            "accounts": [
                {
                    "name": "game",
                    "writable": true
                },
                {
                    "name": "vault",
                    "writable": true,
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const",
                                "value": [
                                    118,
                                    97,
                                    117,
                                    108,
                                    116
                                ]
                            },
                            {
                                "kind": "account",
                                "path": "game"
                            }
                        ]
                    }
                },
                {
                    "name": "feeVault",
                    "writable": true
                },
                {
                    "name": "authority",
                    "signer": true,
                    "relations": [
                        "game"
                    ]
                },
                {
                    "name": "systemProgram",
                    "address": "11111111111111111111111111111111"
                }
            ],
            "args": []
        },
        {
            "name": "autoSettleGame",
            "discriminator": [
                145,
                31,
                128,
                151,
                139,
                140,
                113,
                160
            ],
            "accounts": [
                {
                    "name": "game",
                    "writable": true
                },
                {
                    "name": "vault",
                    "writable": true,
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const",
                                "value": [
                                    118,
                                    97,
                                    117,
                                    108,
                                    116
                                ]
                            },
                            {
                                "kind": "account",
                                "path": "game"
                            }
                        ]
                    }
                },
                {
                    "name": "feeVault",
                    "writable": true
                },
                {
                    "name": "caller",
                    "writable": true,
                    "signer": true
                },
                {
                    "name": "systemProgram",
                    "address": "11111111111111111111111111111111"
                }
            ],
            "args": []
        }
    ],
    "accounts": [
        {
            "name": "bet",
            "discriminator": [
                147,
                23,
                35,
                59,
                15,
                75,
                155,
                32
            ]
        },
        {
            "name": "game",
            "discriminator": [
                27,
                90,
                166,
                125,
                74,
                100,
                121,
                18
            ]
        }
    ],
    "errors": [
        {
            "code": 6000,
            "name": "gameAlreadyEnded",
            "msg": "Game has already ended."
        },
        {
            "code": 6001,
            "name": "gameNotEndedYet",
            "msg": "Game has not ended yet."
        },
        {
            "code": 6002,
            "name": "gameAlreadySettled",
            "msg": "Game has already been settled."
        },
        {
            "code": 6003,
            "name": "gameNotSettled",
            "msg": "Game is not settled yet."
        },
        {
            "code": 6004,
            "name": "alreadyClaimed",
            "msg": "Reward already claimed."
        },
        {
            "code": 6005,
            "name": "noWinner",
            "msg": "No winner determined."
        },
        {
            "code": 6006,
            "name": "notWinner",
            "msg": "You did not bet on the winning side."
        }
    ],
    "types": [
        {
            "name": "bet",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "user",
                        "type": "pubkey"
                    },
                    {
                        "name": "game",
                        "type": "pubkey"
                    },
                    {
                        "name": "amount",
                        "type": "u64"
                    },
                    {
                        "name": "side",
                        "type": {
                            "defined": {
                                "name": "side"
                            }
                        }
                    },
                    {
                        "name": "claimed",
                        "type": "bool"
                    }
                ]
            }
        },
        {
            "name": "game",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "authority",
                        "type": "pubkey"
                    },
                    {
                        "name": "topic",
                        "type": "string"
                    },
                    {
                        "name": "deadline",
                        "type": "i64"
                    },
                    {
                        "name": "totalPoolA",
                        "type": "u64"
                    },
                    {
                        "name": "totalPoolB",
                        "type": "u64"
                    },
                    {
                        "name": "feeVault",
                        "type": "pubkey"
                    },
                    {
                        "name": "status",
                        "type": {
                            "defined": {
                                "name": "gameStatus"
                            }
                        }
                    },
                    {
                        "name": "winner",
                        "type": {
                            "option": {
                                "defined": {
                                    "name": "side"
                                }
                            }
                        }
                    }
                ]
            }
        },
        {
            "name": "gameStatus",
            "type": {
                "kind": "enum",
                "variants": [
                    {
                        "name": "open"
                    },
                    {
                        "name": "settled"
                    }
                ]
            }
        },
        {
            "name": "side",
            "type": {
                "kind": "enum",
                "variants": [
                    {
                        "name": "teamA"
                    },
                    {
                        "name": "teamB"
                    }
                ]
            }
        }
    ]
};
