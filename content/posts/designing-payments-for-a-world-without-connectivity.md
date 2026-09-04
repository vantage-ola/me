---
title: "Designing Payments for a World Without Connectivity"
date: 2026-09-03
tags: [tech, cryptography, technology, payments]
excerpt: "Every digital payment system assumes that connectivity is temporary."
medium_id: "1ea38a73ade7"
medium_url: "https://iloveracing.medium.com/designing-payments-for-a-world-without-connectivity-1ea38a73ade7"
---

Every digital payment system assumes that connectivity is temporary. The network may be unreliable for a few minutes, an hour, or even a day, but the assumption is that it will eventually return and the payment can continue from there.

That assumption makes sense in places where connectivity is reliable enough that losing it is an exception. It makes much less sense in places where connectivity is part of the operating environment.

You see the problem most clearly in places like Nigeria, where unreliable connectivity can turn an ordinary payment into a difficult negotiation. A transfer is sent and remains pending. The merchant’s app does not show the payment. The customer’s phone says one thing and the merchant’s phone says another. Both people are standing there looking at their screens while the queue behind them grows. Eventually someone suggests sending the money again, which creates a second problem: if the first transfer eventually succeeds, there may now be two debits. The alternative is often to abandon the transaction and find cash.

What interests me about this is not simply that it happens. It is that most payment systems treat this situation as a temporary inconvenience. Retry logic, pending states, network errors and delayed reconciliation are all designed around the same assumption: connectivity is coming back, and the system only needs to survive until it does.

After years of seeing the same problem, I think it is worth questioning that assumption directly.

I have been working on a different approach: a payment system in which two phones can transfer value without a network connection at the time of payment. Offline operation is not treated as a degraded mode or an emergency queue. It is the primary case, while connectivity becomes something the system uses later when it becomes available.

## What existing systems do instead

The conventional response to unreliable connectivity is store-and-forward.

The basic idea is straightforward. A device accepts the payment locally, stores the transaction, and sends it to the server once connectivity returns. This is useful, but it does not solve the underlying problem. It mainly changes when the system discovers whether the payment can actually be trusted.

The merchant is accepting a claim that the customer has successfully sent the money. At the moment of payment, the merchant cannot independently verify that the transfer has reached its account. If the transaction later fails during reconciliation, there may be no cryptographic evidence showing what the customer actually committed to at the time.

That leaves the merchant carrying a significant amount of trust. The customer says the money was there. The merchant has to accept that statement and wait for the system to tell them what happened later.

USSD is another common solution, and it genuinely works. That is part of the reason it remains so widely used. But it is not offline. It still depends on the cellular network, the bank’s switching infrastructure, and a session that has to remain active long enough for the transaction to complete.

It changes the interface through which the payment is made, but it does not remove the network dependency.

Cash does remove the dependency.

That is an important comparison. A system designed for unreliable infrastructure should not only be compared with card terminals and modern payment applications in highly connected environments. It should also be compared with the thing that already works when the network disappears completely.

In Nigeria, that thing is still cash.

## The constraint that changes the design

The most important realization came from accepting a limitation rather than trying to engineer around it.

Without communication between transactions, you cannot guarantee that the same money will never be spent twice.

Suppose a customer has no network connection and makes a payment to one merchant. They then walk to another market, still without connectivity, and attempt another payment using the same underlying balance. There is no shared system that can see both transactions and reject the second one.

A digital signature can prove that a particular device authorized a particular message. It cannot, by itself, tell another device that the same value was already spent somewhere else when the two devices have never communicated.

There is an important exception. Tamper-resistant hardware can itself hold and enforce value. A hardware wallet can maintain a balance internally, decrement it when money is spent, and prevent the balance from going below zero. Offline payment systems have used variations of this approach for decades.

That model works because the hardware is not merely protecting a key. It is enforcing the money itself.

A cheap Android phone generally cannot provide that guarantee.

The security hardware available on such a device can protect a private key. It can prevent software from extracting that key and can use it to produce signatures. What it cannot necessarily do is act as a trusted monetary counter whose state can never be manipulated.

That distinction is fundamental. The phone can provide an unforgeable signature. It cannot necessarily provide an unforgeable balance.

Once that is accepted, the objective has to change.

The goal is no longer to make cheating impossible. The goal is to make cheating detectable and provable.

## What the phone can actually prove

The design I have been working on can be understood through two kinds of signed documents.

The first is an identity document issued by the institution responsible for the account. It states that a particular cryptographic key, held by a particular device, is associated with a particular account, and that this authorization is valid for a defined period.

Because the document is signed by the issuer, it cannot simply be forged. More importantly, the document travels with the payment itself. The merchant does not need to query the issuer in order to understand who authorized the transaction.

The second document is the payment.

The customer signs a statement saying, in effect: I am this account, I am paying this amount to this merchant, and this is payment number ***12*** in my sequence.

The sequence number is important because every payment can reference the payment that came before it. That creates an ordered history rather than a collection of unrelated signatures.

This is similar to a cheque book. Each cheque has a number, and the sequence gives the issuer a history of what was supposed to happen.

Now consider the customer attempting to sign two different payments with the same sequence number.

Suppose both payments are labelled number ***12*** , but one is for Merchant A and the other is for Merchant B.

Those two signed documents are evidence of contradictory behaviour. The same hardware key has authorised two different transactions under the same position in its payment history.

That gives the system something considerably stronger than an accusation.

It gives it **proof**.

Anyone who later receives both documents can verify the signatures and establish that the same device produced both conflicting payments. The merchant can verify them. The issuer can verify them. A regulator can verify them. The customer can verify them.

The system does not have to rely entirely on one party’s description of what happened.

This changes where trust sits in the system. Instead of trying to ensure that dishonest behavior can never occur, the protocol creates evidence that makes conflicting behavior attributable once the relevant transactions become visible.

The remaining question is how much risk the system is willing to carry before that happens.

That is where limits become important.

Card systems have long dealt with similar uncertainty through concepts such as floor limits. Small transactions can be accepted more freely, while larger transactions require stronger authorization.

An offline system can apply the same principle. A merchant can inspect the information attached to the payment and estimate how much exposure the customer has accumulated since their identity document was last refreshed.

Small amounts can therefore be accepted under a defined risk limit, while larger payments can require connectivity.

The important point is that the protocol does not eliminate risk. It makes the risk explicit, bounded and attributable.

## Designing for the phones people actually have

Once the protocol was defined, the next constraint was the physical device.

The entire payment document can be represented in a QR code. The version I ended up with is a little over three hundred bytes, which is small enough to fit comfortably into a QR code that a low-quality camera can read from a damaged screen in an ordinary shop.

![embedded raw byte QR code](https://cdn-images-1.medium.com/max/1024/1*Hk_1WPlF6ZR1Qylcgs8-sg.png)

*embedded raw byte QR code*

That constraint turned out to be useful.

It would have been easy to design around NFC because NFC provides a cleaner interaction model. I borrowed the cheapest current Android phone I could find and checked what it actually supported instead of designing around an idealised specification.

It did not have NFC.

It also did not have the kind of high-security enclave I had initially imagined using. It had a basic hardware-backed key store and was clearly a low-memory device.

That changed the design.

A more expensive flagship phone can make a security architecture look much easier than it really is. I also pulled a real attestation chain from my five-year-old flagship phone — a Samsung Note 20 and verified it rather than assuming the capabilities I wanted would exist.

That uncovered another problem: even the flagship could not demonstrate one of the security properties I had assumed I could require.

This matters because it is very very easy to build a protocol that is secure on paper but unusable on the devices your users actually own.

So the baseline became much simpler.

A screen and a camera are the barest minimum . Nearly every phone should haveboth.

Other communication mechanisms can be added later. NFC could make payments more convenient. Bluetooth or sound could provide other transport mechanisms. But none of those should be necessary for the system to function.

The QR path has to remain viable because it is the lowest common denominator.

## What the system does not solve

The limitations are important enough that I would rather state them explicitly.

The first is double-spending risk.

The protocol does not prevent the first conflicting transaction from succeeding. Detection happens after the fact, once the conflicting transactions eventually become visible to the same system.

That means some party has to carry the potential loss.

The role of the protocol is to bound that loss, identify the device responsible, and provide evidence of what happened. If the limits are set badly, the loss is still real money.

The second limitation is that the system still needs connectivity eventually.

It can operate without connectivity at the moment of payment, but it cannot remain disconnected forever and still maintain a global view of the system.

Consider the earlier example. A customer makes payment number twelve to one merchant and then uses another payment number twelve with another merchant. Neither merchant can identify the contradiction while both are offline.

Eventually, however, the transactions have to be reported somewhere.

The system therefore moves synchronization out of the main payment process rather than removing it completely.

There is also a device-admission problem.

The security model depends on being able to establish that the device’s hardware-backed key is genuine and that the software environment has not been modified in a way that undermines the assumptions of the protocol.

That means some devices have to be rejected.

Rooted phones, custom ROMs, emulators and certain older or grey-market devices may not pass the required security checks. Excluding those devices has a real social cost because the people using them are still legitimate users.

At the same time, weakening the requirement too far creates another problem: an attacker could potentially create unlimited fake wallets.

I do not think this is a solved trade-off. It is a genuine constraint between accessibility and security.

Time is another complication.

An offline device does not have a trustworthy network-synchronized clock. A user can change the device time.

Anything in the protocol that relies on time therefore has to be anchored to information the user cannot simply move backwards. That is possible, but the implementation is considerably more complicated than using an ordinary system clock, and it does not behave cleanly in every environment.

Then there is the question of distributing information about bad actors.

Once a device has been identified as having produced conflicting transactions, other offline devices eventually need to know that they should stop accepting payments from it.

Those devices are, by definition, difficult to reach.

The useful property here is that this list grows according to the number of devices caught cheating rather than according to the total number of users. If dishonest users remain a small fraction of the network, that makes the problem considerably more manageable.

Finally, there is finality.

A receipt printed at the moment of an offline payment cannot honestly claim that the transaction is fully settled. It can say that the payment was accepted. It can say that a signed payment was received. It can say that the transaction is pending reconciliation.

It cannot truthfully claim that no conflicting payment exists somewhere else in the network until the system has enough connectivity to establish that.

I made that distinction part of the design, not just the wording.

A system should not tell a merchant that a payment is final simply because saying so makes the product easier to sell. Doing that would hide the risk instead of eliminating it.

Whether merchants will accept an offline payment that is technically pending is therefore not primarily a technical question.

Whether merchants will accept an offline payment that is technically pending is therefore not primarily a technical question. It is a market question, and it may turn out to be the hardest one.

There is one final limitation worth emphasising.

The cryptography is not the difficult part. The difficult parts are licensing, float, settlement infrastructure, agent networks and merchant trust. A cryptographic protocol can be designed by a small team with computers and enough time, but turning that protocol into a payment network requires institutions, capital, regulation and distribution.

I have been working on the part that can be built from a laptop.

## Where this can actually be useful

The interesting property of the system is not simply that a payment can survive a bad network.

It is that the transaction itself no longer requires a server round trip.

In a conventional digital payment, every transaction depends on that round trip. It introduces latency, infrastructure cost and a point of failure into the moment when the customer is actually trying to pay.

In an offline-first system, the immediate interaction can be reduced to two phones exchanging a signed payment document.

The issuer is still necessary. It has to authorize identities, reconcile transactions, settle funds and distribute information about invalid or compromised devices. But those activities do not have to occur while a customer is standing in front of a merchant waiting for the transaction to complete.

They can happen later and in batches.

That changes the cost structure.

It is particularly interesting for small payments. A transaction with a very small value may not make much economic sense when every payment has to be individually routed through centralised infrastructure.

With an offline-first protocol, the customer and merchant can complete the interaction locally and allow reconciliation to happen later.

That opens the possibility of serving environments where connectivity is unreliable, margins are thin, or the cost of maintaining a continuous online connection is disproportionately high.

The same architecture is not limited to retail payments.

Transit systems could continue accepting payments when their backhaul connection fails. Humanitarian organizations could distribute funds in places where recipients have little or no connectivity. Agent networks could reconcile periodically rather than maintaining an active session for every interaction.

The same principle becomes relevant during blackouts, disasters, network outages, inside tunnels, on aircraft, across borders and in any other environment where communications are unavailable for some period of time.

The distinction is that in some places these situations are rare failures. In others, they are ordinary operating conditions.

Designing for the latter may produce infrastructure that happens to work better in the former as well.

## What I actually think

I would not call this a revolution.

At this stage, I think of it as a floor.

A payment system should have some basic capability underneath it that allows a network outage to turn a transaction into a slower transaction rather than turning it into no transaction at all.

That is not particularly glamorous. Infrastructure rarely is.

But when the underlying assumption finally fails, the absence of that infrastructure becomes obvious.

I have not proved the system yet.

The protocol exists, but the work now is in testing it against real devices and real failure modes. The important questions are no longer just whether the cryptography works, but whether the assumptions survive contact with the hardware, the payment flow and the conditions this system is actually meant for.

The test I ultimately care about is simple.

Two cheap phones. Both in airplane mode. Money moves from one to the other. A receipt is produced. Then the same payment sequence is used again, and the system has to produce the evidence it was designed to produce.

Until that happens on real hardware, this is still a protocol design rather than a product.

So that is where I am leaving it for now.

I will keep building, testing, and finding the places where the assumptions break. Thanks for reading. Cheers.
