export interface State<T> {
  loading: boolean
  data?: T
  error?: string
}

export type Game = {
  id: string
  choices: GameChoice[]
}

export type GameChoice = {
  player: string
  choice: string
}
