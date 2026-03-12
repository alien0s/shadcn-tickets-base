import { SeriesRepository } from './series.repository.js'

export class SeriesService {
  private repository: SeriesRepository

  constructor() {
    this.repository = new SeriesRepository()
  }

  async listSeries(educationLevelId?: string) {
    return this.repository.findAll(educationLevelId)
  }
}
