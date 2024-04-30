import { runtimeModule, state, runtimeMethod } from "@proto-kit/module";
import { State, assert } from "@proto-kit/protocol";
import { Balance, Balances as BaseBalances, TokenId, UInt64 } from "@proto-kit/library";
import { Field, PublicKey } from "o1js";

interface Message {
    MessageNumber: Field;
    MessageDetail: MessageDetail;
}

interface MessageDetail {
    AgentId: Field;
    Characters: [12];
    SecurityCode: [2];
}

@runtimeModule()
export class Challenge extends BaseBalances<Message> {
    @state() public circulatingSupply = State.from<Balance>(Balance);

    @runtimeMethod()
    public addBalance(
        tokenId: TokenId,
        address: PublicKey,
        amount: Balance
    ): void {
        const circulatingSupply = this.circulatingSupply.get();
        const newCirculatingSupply = Balance.from(circulatingSupply.value).add(
            amount
        );
        assert(
            newCirculatingSupply.lessThanOrEqual(this.config.totalSupply),
            "Circulating supply would be higher than total supply"
        );
        this.circulatingSupply.set(newCirculatingSupply);
        this.mint(tokenId, address, amount);
    }
}
