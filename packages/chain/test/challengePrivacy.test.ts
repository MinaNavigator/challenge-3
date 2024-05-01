import { TestingAppChain } from "@proto-kit/sdk";
import { Character, CircuitString, Field, PrivateKey } from "o1js";
import { Message, AgentState } from "../src/challenge";
import { AgentProof, ChallengePrivacy, AgentProofData } from "../src/challengePrivacy";
import { log } from "@proto-kit/common";
import { Balances, BalancesKey, TokenId, UInt64 } from "@proto-kit/library";
import { promises as fs } from "fs";

log.setLevel("ERROR");


describe("challenge privacy", () => {
    let contract: ChallengePrivacy;
    let appChain: ReturnType<
        typeof TestingAppChain.fromRuntime<{ ChallengePrivacy: typeof ChallengePrivacy }>
    >;

    const alicePrivateKey = PrivateKey.random();
    const alice = alicePrivateKey.toPublicKey();

    beforeAll(async () => {
        // await AgentProof.compile();
    });

    beforeEach(async () => {
        appChain = TestingAppChain.fromRuntime({
            ChallengePrivacy,
        });

        appChain.configurePartial({
            Runtime: {
                ChallengePrivacy: {},
                Balances: {}
            }
        });

        await appChain.start();
        appChain.setSigner(alicePrivateKey);

        contract = appChain.runtime.resolve("ChallengePrivacy");

    });

    it("add new message", async () => {


        // add agent
        const tx1 = await appChain.transaction(alice, () => {
            contract.addAgent(Field(1), CircuitString.fromString("A5"));
        });
        await tx1.sign();
        await tx1.send();


        let block = await appChain.produceBlock();

        let agent = await appChain.query.runtime.ChallengePrivacy.agentState.get(Field(1));
        console.log("agent last message", agent?.LastMessage.toJSON());
        expect(agent?.LastMessage).toEqual(Field(0));

        let message: Message = {
            MessageNumber: Field(1),
            MessageDetail: {
                AgentId: Field(1),
                SecurityCode: CircuitString.fromString("A5"),
                Message: CircuitString.fromString("test12345678")
            }
        };

        const result = await fs.readFile('proof.json');
        // we have pregenerated a proof in json file
        const pregeneratedProof = JSON.parse(result.toString());

        const proof = AgentProofData.fromJSON(pregeneratedProof);

        const tx2 = await appChain.transaction(alice, () => {
            contract.addProofMessage(proof);
        });

        await tx2.sign();
        await tx2.send();
        console.log("sent");
        await appChain.produceBlock();
        console.log("block built");
        agent = await appChain.query.runtime.ChallengePrivacy.agentState.get(Field(1));
        console.log("agent last message", agent?.LastMessage.toJSON());

        // You should update the agent state to store the last message number received.
        expect(agent?.LastMessage).toEqual(Field(1));
    });

    // take too much time to prove XD
    /*
        it("exist in system", async () => {
            let message: Message = {
                MessageNumber: Field(5),
                MessageDetail: {
                    AgentId: Field(0),
                    SecurityCode: CircuitString.fromString("A5"),
                    Message: CircuitString.fromString("test12345678")
                }
            };
            const proof = await AgentProof.proveMessage(
                message
            );
            const tx2 = await appChain.transaction(alice, () => {
                contract.addProofMessage(proof);
            });
    
            await tx2.sign();
            await tx2.send();
    
            const block = await appChain.produceBlock();
            // The AgentID exists in the system
            expect(block?.transactions[0].statusMessage).toEqual("Agent didn't exist");
        });
    
        it("security code", async () => {
            let message: Message = {
                MessageNumber: Field(5),
                MessageDetail: {
                    AgentId: Field(1),
                    SecurityCode: CircuitString.fromString("ZZ"),
                    Message: CircuitString.fromString("test12345678")
                }
            };
            const proof = await AgentProof.proveMessage(
                message
            );
            const tx2 = await appChain.transaction(alice, () => {
                contract.addProofMessage(proof);
            });
    
            await tx2.sign();
            await tx2.send();
    
            const block = await appChain.produceBlock();
            // The security code matches that held for that AgentID
            expect(block?.transactions[0].statusMessage).toEqual("Incorrect security code");
        });
    
        it("incorrect length", async () => {
            let message: Message = {
                MessageNumber: Field(5),
                MessageDetail: {
                    AgentId: Field(1),
                    SecurityCode: CircuitString.fromString("A5"),
                    Message: CircuitString.fromString("small")
                }
            };
    
            // The message is of the correct length.
            await expect(async () => {
                const proof = await AgentProof.proveMessage(
                    message
                );
                const tx2 = await appChain.transaction(alice, () => {
                    contract.addProofMessage(proof);
                });
            }).rejects.toThrow("Incorrect length");
    
        });
    
    
        it("Message number greather", async () => {
    
            let message: Message = {
                MessageNumber: Field(0),
                MessageDetail: {
                    AgentId: Field(1),
                    SecurityCode: CircuitString.fromString("A5"),
                    Message: CircuitString.fromString("test12345678")
                }
            };
    
            const proof = await AgentProof.proveMessage(
                message
            );
            const tx2 = await appChain.transaction(alice, () => {
                contract.addProofMessage(proof);
            });
    
            await tx2.sign();
            await tx2.send();
    
    
            //The message number is greater than the highest so far for that agent   
            const block = await appChain.produceBlock();
            expect(block?.transactions[0].statusMessage).toEqual("Incorrect message number");
    
        });
        */
});
