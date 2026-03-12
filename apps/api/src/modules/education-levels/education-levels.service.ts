import { EducationLevelsRepository } from './education-levels.repository.js'

export class EducationLevelsService {
  private repository: EducationLevelsRepository

  constructor() {
    this.repository = new EducationLevelsRepository()
  }

  async listEducationLevels() {
    return this.repository.findAll()
  }
}

