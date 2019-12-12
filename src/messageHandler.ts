import * as Discord from "discord.js";
import { handleCommand } from "./commandHandling";
import * as publicConfig from "./config/public-config.json";
import { syncToGeneral, syncToNoBSChannel } from "./sync";

export async function messageHandler(client: Discord.Client, message: Discord.Message) {
	if (message.author.bot) {
		return;
	}

	if (message.channel.type === "dm") {
		return;
	}
	const channelName = (message.channel as Discord.TextChannel).name;

	if (channelName === publicConfig.syncChannel) {
		// sync the message back from the nobs-chat channel, then leave it alone
		syncToGeneral(message);
		return;
	}

	if (publicConfig.permittedChannels.indexOf(channelName) < 0) {
		// we're not wanted here
		return;
	}

	if (message.content.startsWith("!")) {
		try {
			handleCommand(message);
		} catch (e) {
			console.log(e); // log somewhere??
		}
	} else if (channelName === publicConfig.generalChannel) {
		// sync to #nobs-chat
		syncToNoBSChannel(message);
	}
}