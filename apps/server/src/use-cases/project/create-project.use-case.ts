import { IProjectRepository } from '../../domain/repositories/project.repository';
import { Project } from '../../domain/entities';

export class CreateProjectUseCase {
  constructor(private projectRepository: IProjectRepository) {}

  async execute(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    return this.projectRepository.create(data);
  }
}
