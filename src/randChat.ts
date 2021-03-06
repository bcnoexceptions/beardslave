import * as Discord from "discord.js";
import { getUserName } from "./knownUsers";
import { tryToPostInSameChannel } from "./channels";

export function randChat(
	message: Discord.Message,
	start: string,
	middle: string,
	end: string,
	randAppend?: string,
	punc?: string,
	isCap?: boolean,
	max?: number)
{
	let result: string;
	if (!max || max === 0) {
		max = 45;
	}
	let rNum = Math.floor(Math.random() * Math.floor(max)) + 1;
	result = start;
	for (let i: number = 0; i < rNum; i++) {
		result += middle;
	}
	result += end;

	rNum = Math.random();

	if ((rNum < .125) && randAppend) {  
		//Same as 1/8 chance which is what it was in coolchat
		result += randAppend;
	}
	
	if (punc) {
		rNum = Math.floor(Math.random() * 4) + 1;

		for (let i: number = 0; i < rNum; i++) {
			result += punc;
		}
	}

	if (!isCap) {
		result = result.toLowerCase();
	}

	if (message.member) {
		tryToPostInSameChannel(message, result, getUserName(message.member), "Can't spoof on this channel");
	}
}
