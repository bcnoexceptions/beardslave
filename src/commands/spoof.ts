import * as Discord from "discord.js";
import { notifyAuthorOfFailure } from "../util";
import { getUserName, UserManager } from "../knownUsers";
import { tryToPostInSameChannel } from "../channels";
import { isPersonSpoofable } from "../database";

export default function process(message: Discord.Message): void {
    const pieces = message.content.split(/\s+/);
    if (pieces.length < 3) {
        notifyAuthorOfFailure(message, "bad spoof!");
        return; // need "!spoof", user, message
    }

    const userToSpoof = pieces[1];

    const userPos = message.content.indexOf(userToSpoof);
    let spoofText = message.content.substring(userPos + userToSpoof.length + 1);
    spoofText = "`[spoof]`" + spoofText; // so people know it's a spoof

    const knownUserRecord = UserManager.getInstance().lookupUser(userToSpoof);

    let userName: string, avatar: string | null;
    if (knownUserRecord) {
        userName = getUserName(knownUserRecord);

        // tricky: use user.username to match, not their current nickname
        if (!isPersonSpoofable(knownUserRecord.user.username))
        {
            message.author.send(`${userName} has requested not to be spoofed`);
            return;
        }

        avatar = knownUserRecord.user.avatarURL();
    } else {
        userName = userToSpoof;
        avatar = "";
    }

    tryToPostInSameChannel(
        message,
        spoofText,
        userName,
        "Can't spoof on this channel",
        avatar ?? undefined
    );
}

process.help = "!spoof <person> <jawnz>";
