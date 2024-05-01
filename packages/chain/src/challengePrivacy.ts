import { runtimeModule, state, runtimeMethod, RuntimeModule } from "@proto-kit/module";
import { State, StateMap, assert } from "@proto-kit/protocol";
import { Balance, Balances as BaseBalances, TokenId, } from "@proto-kit/library";
import { Bool, Character, CircuitString, Experimental, Field, Poseidon, PublicKey, Struct, UInt64 } from "o1js";
import { emptyValue } from "o1js/dist/node/lib/proof_system";
import { AgentState, Challenge, Message, checkLength } from "./challenge";


export class BlockInfo extends Struct({
    BlockHeight: UInt64,
    Sender: PublicKey,
    SenderNonce: UInt64,
}) { }

export class ProofInfo extends Struct({
    AgentId: Field,
    LastMessage: Field,
    SecurityCode: Field
}) { }


export const AgentProof = Experimental.ZkProgram({
    publicOutput: ProofInfo,

    methods: {
        proveMessage: {
            privateInputs: [Message],
            method(Message: Message) {

                checkLength(Message.MessageDetail.SecurityCode, 2);
                checkLength(Message.MessageDetail.Message, 12);

                const securityCodeHash = Poseidon.hash(Message.MessageDetail.SecurityCode.toFields());

                return new ProofInfo({ AgentId: Message.MessageDetail.AgentId, LastMessage: Message.MessageNumber, SecurityCode: securityCodeHash });
            },
        },
    },
});

export class AgentProofData extends Experimental.ZkProgram.Proof(
    AgentProof
) { }


@runtimeModule()
export class ChallengePrivacy extends Challenge {
    @state() public agentBlockInfo = StateMap.from<Field, BlockInfo>(Field, BlockInfo);

    @runtimeMethod()
    public override addMessage(
        Message: Message
    ): void {
        assert(Bool(false), ("ObsoleteMethod use addProofMessage"));
    }

    @runtimeMethod()
    public addProofMessage(
        Proof: AgentProofData
    ): void {
        const output = Proof.publicOutput;
        const agentStateCurrent = this.agentState.get(output.AgentId);
        assert(agentStateCurrent.isSome, "Agent didn't exist");
        assert(output.SecurityCode.equals(agentStateCurrent.value.SecurityCode), "Incorrect security code");
        assert(output.LastMessage.greaterThan(agentStateCurrent.value.LastMessage), "Incorrect message number");

        Proof.verify();

        this.setState(output.AgentId, output.LastMessage);


    }

    protected override setState(AgentId: Field, LastMessage: Field) {
        const agentStateCurrent = this.agentState.get(AgentId);
        agentStateCurrent.value.LastMessage = LastMessage;
        // update data with last message number
        this.agentState.set(AgentId, agentStateCurrent.value);

        // store block data
        const blockInfo = new BlockInfo({
            BlockHeight: this.network.block.height,
            Sender: this.transaction.sender.value,
            SenderNonce: this.transaction.nonce.value,
        });

        this.agentBlockInfo.set(AgentId, blockInfo);
    }
}
