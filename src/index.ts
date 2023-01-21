import { ButtonStyle, Client, Collection, Events, GatewayIntentBits, REST, Routes } from 'discord.js'
import { nanoid } from 'nanoid'
import Game from './game.js';
(await import('dotenv')).config()

const { TOKEN, CLIENT_ID }: { TOKEN: string, CLIENT_ID: string } = process.env as { TOKEN: string, CLIENT_ID: string }

const { SlashCommandSubcommandBuilder: Command, ActionRowBuilder: Actions, EmbedBuilder: Embed, StringSelectMenuBuilder: SelectMenu, ModalBuilder: Modal, ButtonBuilder: Button } = await import('discord.js')

// @ts-ignore
const client: Client & { games: Collection<string, Game> } = new Client({ intents: [GatewayIntentBits.Guilds] });
// @ts-ignore
client.games = new Collection()

const rest =  new REST({ version: '10' }).setToken(TOKEN)

const commands = [
    new Command().setName("game").setDescription("Creates a new game"),
]

const buttons = {
    take: () => {
        return new Button().setLabel("Take points").setStyle(ButtonStyle.Success).setCustomId("take-points")
    },
    give: () => {
        return new Button().setLabel("Give points").setStyle(ButtonStyle.Danger).setCustomId("give-points")
    },
    join: (id: string) => {
        return new Button().setLabel("Join Game").setStyle(ButtonStyle.Primary).setCustomId(`join-${id}`)
    }
}


client.on(Events.InteractionCreate, async (interaction) => {
    // console.log(interaction)
    if(interaction.isCommand()) {
        if(interaction.commandName === "game") {
            const id = nanoid(10);
            client.games.set(id, new Game(id, interaction.user))
            const row = new Actions().addComponents(buttons.join(id))
            await interaction.reply({
                content: `Join Game ||${id}||`,
                //@ts-ignore
                components: [row]
            })
        }
    } else if(interaction.isButton()) {
        if(/join-.*/.test(interaction.customId)) {
            // @ts-ignore
            const game = client.games.get(/join-(.*)/.exec(interaction.customId)?.[1])
            console.log(game)
            if(game?.teams.get("TEAM_1")?.player?.id === interaction.user.id) {
                interaction.reply({
                    content: "You cannot join yourself!s",
                    ephemeral: true
                })
            } else {
                const success = game?.add(interaction.user)
                console.log(success)
                if(success) {
                    await game?.createQuiz()
                    await interaction.message.edit("Game in progress")
                    await interaction.reply({ content: "Joined", ephemeral: true })
                } else {
                    await interaction.reply({ content: "You can not join yourself", ephemeral: true })
                }
            }
        }
    }
})

await rest.put(
	Routes.applicationCommands(CLIENT_ID),
	{ body: commands },
);

await client.login(TOKEN)
import e from 'express'
const app = e()

app.get('/', (req, res) => {
    res.send(JSON.stringify(client.games.map((v) => {
        return v.json
    })))
})

app.listen(3000, "0.0.0.0")