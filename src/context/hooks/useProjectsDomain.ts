import { useCallback } from 'react';
import { Project, Task, Stage, Idea } from '../../types';
import { usePersistentState } from '../../hooks/usePersistentState';
import { ShowToastFn } from './useToasts';

export function useProjectsDomain(
  showToast: ShowToastFn,
  setTasks?: React.Dispatch<React.SetStateAction<Task[]>>,
  setStages?: React.Dispatch<React.SetStateAction<Stage[]>>,
  setIdeas?: React.Dispatch<React.SetStateAction<Idea[]>>
) {
  const [projects, setProjects] = usePersistentState<Project[]>(
    'projects',
    []
  );

  const addProject = useCallback(
    (projectData: Omit<Project, 'id' | 'createdAt' | 'lastActivityAt'>) => {
      const newProj: Project = {
        ...projectData,
        id: `proj-${Date.now()}`,
        createdAt: new Date().toISOString().split('T')[0],
        lastActivityAt: new Date().toISOString()
      };
      setProjects((prev) => [newProj, ...prev]);
      showToast('Projeto Criado', `"${newProj.name}" já está ativo no seu painel.`);
    },
    [setProjects, showToast]
  );

  const updateProject = useCallback(
    (id: string, updates: Partial<Project>) => {
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates, lastActivityAt: new Date().toISOString() } : p))
      );
      if (updates.name && setTasks) {
        setTasks((prev) =>
          prev.map((t) => (t.projectId === id ? { ...t, projectName: updates.name } : t))
        );
      }
      showToast('Projeto Atualizado', 'As alterações foram salvas.');
    },
    [setProjects, setTasks, showToast]
  );

  const deleteProject = useCallback(
    (id: string) => {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (setTasks) {
        setTasks((prev) => prev.filter((t) => t.projectId !== id));
      }
      if (setStages) {
        setStages((prev) => prev.filter((s) => s.projectId !== id));
      }
      if (setIdeas) {
        setIdeas((prev) => prev.filter((i) => i.projectId !== id));
      }
      showToast('Projeto Removido', 'O projeto foi excluído com segurança.', 'info');
    },
    [setProjects, setTasks, setStages, setIdeas, showToast]
  );

  return {
    projects,
    setProjects,
    addProject,
    updateProject,
    deleteProject
  };
}
