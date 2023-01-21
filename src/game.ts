import { Collection, ThreadChannel, ChannelType, Interaction, User } from 'discord.js'

type Question = {
    answers: Array<{
        name: string,
        correct: boolean,
    }>,
    question: string,
    category: string
}

type Team = {
    player?: User,
    points: number,
    chat?: ThreadChannel
}

async function from(raw: Promise<any>): Promise<Array<Question>> {
    const { results }: { response_code: 0, results: Array<{category: string, question: string, correct_answer: string, incorrect_answers: string[]}> } = await (await raw).json()
    return results.map((v) => ({
        category: v.category,
        question: v.question,
        answers: [
            {
                name: v.correct_answer,
                correct: true,
            },
            ...v.incorrect_answers.map(v => ({
                name: v,
                correct: false
            }))
        ]
    }))
}

export default class Game {
    #teams: Collection<"TEAM_1" | "TEAM_2", Team>;
    #quiz: Array<Question>;
    #questionID: number;
    #id: string
    #playing: boolean

    constructor(id: string, owner: User) {
        this.#playing = false
        this.#id = id
        this.#quiz = []
        this.#teams = new Collection()
        this.#teams.set("TEAM_1", {
            player: owner,
            points: 0
        })
        this.#teams.set("TEAM_2", {
            points: 0
        })
        this.#questionID = 0
    }

    async createQuiz() {
        this.#quiz = await from(fetch("https://opentdb.com/api.php?amount=10"))
    }

    get question() {
        return this.#quiz[this.#questionID]
    }

    get teams() {
        return this.#teams
    }

    answer(guess: string) {
        return this.question.answers.find((v) => v.name === guess)?.correct
    }

    async createChats(interaction: Interaction) {

    }

    add(player: User) {
        if(!this.#playing) {
            this.#teams.set("TEAM_2", {
                points: 0,
                player
            })
            this.#playing = true
            return true
        }
        return false
    }

    get json() {
        return {
            id: this.#id,
            teams: this.#teams.toJSON(),
            playing: this.#playing,
            questionID: this.#questionID,
            quiz: this.#quiz
        }
    }
}
