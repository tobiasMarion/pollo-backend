interface Props {
  run: () => Promise<void>
  debounceMs: number
  maxWaitMs: number
}

export class SimulationScheduler {
  private isRunning = false
  private receivedUpdates = false
  private lastRun = Date.now()
  private debounceTimer: NodeJS.Timeout | null = null
  private maxTimer: NodeJS.Timeout | null = null
  private run: () => Promise<void>
  private debounceMs: number
  private maxWaitMs: number

  constructor({ run, debounceMs, maxWaitMs }: Props) {
    this.run = run
    this.debounceMs = debounceMs
    this.maxWaitMs = maxWaitMs

    this.trigger = this.trigger.bind(this)
  }

  public notifyUpdate(): void {
    this.receivedUpdates = true
    this.resetDebounceTimer()
    this.scheduleMaxWaitTimer()
  }

  private resetDebounceTimer(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }

    this.debounceTimer = setTimeout(this.trigger, this.debounceMs)
  }

  private scheduleMaxWaitTimer(): void {
    if (this.maxTimer) return

    const elapsed = Date.now() - this.lastRun
    const remaining = Math.max(0, this.maxWaitMs - elapsed)

    this.maxTimer = setTimeout(this.trigger, remaining)
  }

  private clearTimers(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }

    if (this.maxTimer) {
      clearTimeout(this.maxTimer)
      this.maxTimer = null
    }
  }

  private async trigger(): Promise<void> {
    if (this.isRunning || !this.receivedUpdates) return

    this.clearTimers()

    this.isRunning = true
    this.lastRun = Date.now()
    this.receivedUpdates = false

    try {
      await this.run()
    } catch (error) {
      console.error('Error in simulation run:', error)
    } finally {
      this.isRunning = false
    }
  }
}
