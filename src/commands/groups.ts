import * as Discord from "discord.js";
import { moveMessagePortToContext } from "worker_threads";
import { getUserName } from "../knownUsers";
import { addRoleToMembers, createRole, findRole, getAllRoles, getUsersWithRole, removeRoleFromMembers, tryDeleteRole } from "../roles";
import { notifyAuthorOfFailure } from "../util";

export default async function process(message: Discord.Message): Promise<void> {
	
	const args = message.content.split(" ")
	let action: string = ''
	let roleName: string = '';
	try {
		action = args[1].toUpperCase();
		if (action !== "LIST") {
			roleName = makeRoleName(args.slice(2));
			if (!roleName) throw new Error('No role name')
		}
	}
	catch {
		action = "HELP";
	}

	switch (action) {
		case "CREATE":
			await createGroup(message,roleName);
			break;
		case "JOIN":
			await joinGroup(message,roleName);
			break;
		case "LEAVE":
			await leaveGroup(message,roleName);
			break;
		case "DELETE":
			await deleteGroup(message,roleName);
			break;
		case "MEMBERS":
			listMembership(message,roleName);
			break;
		case "LIST": 
			listGroups(message);
			break;
		case "HELP": 
		default:
			expandedHelp(message);
			break;

	}
}

async function createGroup(message: Discord.Message, newRoleName: string) {
	const existingRoles = getAllRoles(message.guild as Discord.Guild);

	let roleAlreadyExists = false;
	for(const role of existingRoles) {
		if (role.name.toUpperCase() === newRoleName.toUpperCase()) {
			roleAlreadyExists = true;
		}
	}

	if (roleAlreadyExists) {
		notifyAuthorOfFailure(message,`Role ${newRoleName} already exists`)
		return;
	}

	const newRole = await createRole(message.guild as Discord.Guild, newRoleName, true)
	
	const failures: Discord.GuildMember[] = []
	addRoleToMembers(newRole, [message.member as Discord.GuildMember], failures);

	message.channel.send(`New group ${newRole.name} created successfully`);
}
async function joinGroup(message: Discord.Message, roleNameToJoin: string) {
	const role = findRole(message.guild as Discord.Guild, roleNameToJoin)

	if (!role) {
		notifyAuthorOfFailure(message, `Group ${roleNameToJoin} does not exist. Use !groups list to see available groups, or !groups create to make one` )
		return;
	}
	const failures: Discord.GuildMember[] = []
	addRoleToMembers(role, [message.member as Discord.GuildMember], failures)

	if (failures.length > 0) {
		notifyAuthorOfFailure(message, "Unable to join group. Try again later, and if that doesn't work, yell at one of the beardmage programmers")
	}
	else {
		message.author.send(`Successfully joined group ${roleNameToJoin}`)
	}
}

async function leaveGroup(message: Discord.Message, roleNameToLeave: string) {
	const role = findRole(message.guild as Discord.Guild, roleNameToLeave)

	if (!role) {
		notifyAuthorOfFailure(message, `Group ${roleNameToLeave} does not exist` )
		return;
	}
	const failures: Discord.GuildMember[] = []
	removeRoleFromMembers(role, [message.member as Discord.GuildMember], failures)

	if (failures.length > 0) {
		notifyAuthorOfFailure(message, "Unable to leave group. Try again later, and if that doesn't work, yell at one of the beardmage programmers")
	}
	else {
		message.author.send(`Successfully left group ${roleNameToLeave}`)
	}
}

async function deleteGroup(message: Discord.Message, roleNameToDelete: string) {
	const server = message.guild as Discord.Guild
	const success: boolean = await tryDeleteRole(server, roleNameToDelete);

	if (success) {
		message.channel.send(`Successfully deleted ${roleNameToDelete}`);
	}
	else {
		notifyAuthorOfFailure(message,`Failed to delete ${roleNameToDelete}. Either the role doesn't exist, or Discord said no`);
	}
}

function listMembership(message: Discord.Message, roleName: string) {
	const server = message.guild as Discord.Guild;

	const role = findRole(server, roleName);

	console.log(JSON.stringify(role));

	if (!role) {
		notifyAuthorOfFailure(message, `${roleName} is not a valid group`);
		return;
	}

	const users = getUsersWithRole(server, role);
	if (users.length === 0) {
		message.author.send(`${roleName} has no members`);
		return;
	}

	let toSend = `${roleName} has the following members:`;
	for(const user of users) {
		toSend += `\n${getUserName(user)}`;
	}
	message.author.send(toSend);
}

function listGroups(message: Discord.Message) {
	const roles: Discord.Role[] = getAllRoles(message.guild as Discord.Guild);
	const groupRoles: Discord.Role[] = roles.filter((role: Discord.Role) => role.name.startsWith('g-'));

	let listToSend: string = `The following groups are available: `;

	for(const role of groupRoles) {
		listToSend += `\n${role.name}`;
	}

	message.author.send(listToSend);
}


function expandedHelp(message: Discord.Message) {

	const helpMessage = `
	To ping a group, simply @mention the group name (which will always start with "g-")
	Available commands:
	\`
	!groups create <groupname> - Creates a group
	!groups join <groupname> - Join the group
	!groups leave <groupname> - Leave the group
	!groups delete <groupname> - Delete the group 
	!groups members <groupname> - See who is in a group
	!groups list - Get a PM with all available groups
	!groups help - See this again
	\``;
	message.author.send(helpMessage);
}

function makeRoleName(roleNameArray: string[]) {
	if (roleNameArray.length < 1) {
		throw new Error('No name provided');
	}
	const roleName = roleNameArray.join('-');

	if (roleName.startsWith("g-")) return roleName;
	return "g-"+roleName;
} 

// uncomment to support !help
process.help = "Create, join and manage ad-hoc groups. Use !groups help for more information"; 
