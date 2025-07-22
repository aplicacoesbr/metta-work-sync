import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, Edit2, Trash2, Search, FolderOpen, FolderClosed, CheckCircle, XCircle, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'aberto' | 'fechado';
  created_at: string;
  stages?: Stage[];
}

interface Stage {
  id: string;
  name: string;
  description?: string;
  project_id: string;
  created_at: string;
  tasks?: Task[];
}

interface Task {
  id: string;
  name: string;
  description?: string;
  stage_id: string;
  created_at: string;
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [stages, setStages] = useState<Record<string, Stage[]>>({});
  const [tasks, setTasks] = useState<Record<string, Task[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewProject, setShowNewProject] = useState(false);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    status: 'aberto' as const,
  });

  const [newStage, setNewStage] = useState<Record<string, { name: string; description: string }>>({});
  const [newTask, setNewTask] = useState<Record<string, { name: string; description: string }>>({});

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProjects(projects);
    } else {
      const filtered = projects.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProjects(filtered);
    }
  }, [searchTerm, projects]);

  const loadProjects = async () => {
    try {
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      const { data: stagesData, error: stagesError } = await supabase
        .from('stages')
        .select('*')
        .order('created_at', { ascending: true });

      if (stagesError) throw stagesError;

      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: true });

      if (tasksError) throw tasksError;

      setProjects((projectsData as Project[]) || []);
      
      // Group stages by project
      const stagesByProject: Record<string, Stage[]> = {};
      stagesData?.forEach(stage => {
        if (!stagesByProject[stage.project_id]) {
          stagesByProject[stage.project_id] = [];
        }
        stagesByProject[stage.project_id].push(stage);
      });
      setStages(stagesByProject);

      // Group tasks by stage
      const tasksByStage: Record<string, Task[]> = {};
      tasksData?.forEach(task => {
        if (!tasksByStage[task.stage_id]) {
          tasksByStage[task.stage_id] = [];
        }
        tasksByStage[task.stage_id].push(task);
      });
      setTasks(tasksByStage);

    } catch (error) {
      console.error('Error loading projects:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os projetos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    if (!newProject.name.trim()) return;

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert(newProject)
        .select()
        .single();

      if (error) throw error;

      setProjects([data as Project, ...projects]);
      setNewProject({ name: '', description: '', status: 'aberto' });
      setShowNewProject(false);
      
      toast({
        title: 'Sucesso',
        description: 'Projeto criado com sucesso!',
      });
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o projeto.',
        variant: 'destructive',
      });
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setProjects(projects.map(p => p.id === id ? { ...p, ...updates } : p));
      setEditingProject(null);
      
      toast({
        title: 'Sucesso',
        description: 'Projeto atualizado com sucesso!',
      });
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o projeto.',
        variant: 'destructive',
      });
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProjects(projects.filter(p => p.id !== id));
      delete stages[id];
      
      toast({
        title: 'Sucesso',
        description: 'Projeto excluído com sucesso!',
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o projeto.',
        variant: 'destructive',
      });
    }
  };

  const createStage = async (projectId: string) => {
    const stageData = newStage[projectId];
    if (!stageData?.name.trim()) return;

    try {
      const { data, error } = await supabase
        .from('stages')
        .insert({
          name: stageData.name,
          description: stageData.description,
          project_id: projectId,
        })
        .select()
        .single();

      if (error) throw error;

      setStages(prev => ({
        ...prev,
        [projectId]: [...(prev[projectId] || []), data]
      }));
      
      setNewStage(prev => ({
        ...prev,
        [projectId]: { name: '', description: '' }
      }));
      
      toast({
        title: 'Sucesso',
        description: 'Etapa criada com sucesso!',
      });
    } catch (error) {
      console.error('Error creating stage:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a etapa.',
        variant: 'destructive',
      });
    }
  };

  const createTask = async (stageId: string) => {
    const taskData = newTask[stageId];
    if (!taskData?.name.trim()) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          name: taskData.name,
          description: taskData.description,
          stage_id: stageId,
        })
        .select()
        .single();

      if (error) throw error;

      setTasks(prev => ({
        ...prev,
        [stageId]: [...(prev[stageId] || []), data]
      }));
      
      setNewTask(prev => ({
        ...prev,
        [stageId]: { name: '', description: '' }
      }));
      
      toast({
        title: 'Sucesso',
        description: 'Tarefa criada com sucesso!',
      });
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a tarefa.',
        variant: 'destructive',
      });
    }
  };

  const toggleProjectExpansion = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const toggleStageExpansion = (stageId: string) => {
    const newExpanded = new Set(expandedStages);
    if (newExpanded.has(stageId)) {
      newExpanded.delete(stageId);
    } else {
      newExpanded.add(stageId);
    }
    setExpandedStages(newExpanded);
  };

  if (loading) {
    return (
      <Layout currentPage="projects">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout currentPage="projects">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Projetos</h1>
            <p className="text-muted-foreground">Gerencie projetos, etapas e tarefas</p>
          </div>
          <Button onClick={() => setShowNewProject(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Projeto
          </Button>
        </div>

        {/* Search Bar */}
        <Card className="shadow-sm">
          <CardContent className="pt-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar projetos por nome ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* New Project Form */}
        {showNewProject && (
          <Card className="shadow-md border-primary/20">
            <CardHeader>
              <CardTitle>Criar Novo Projeto</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="dados" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="dados">Dados do Projeto</TabsTrigger>
                  <TabsTrigger value="estrutura">Estrutura</TabsTrigger>
                </TabsList>
                
                <TabsContent value="dados" className="space-y-4">
                  <div>
                    <Label htmlFor="project-name">Nome do Projeto *</Label>
                    <Input
                      id="project-name"
                      value={newProject.name}
                      onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Digite o nome do projeto"
                    />
                  </div>
                  <div>
                    <Label htmlFor="project-description">Descrição</Label>
                    <Textarea
                      id="project-description"
                      value={newProject.description}
                      onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descrição do projeto (opcional)"
                      rows={3}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="estrutura" className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Após criar o projeto, você poderá adicionar etapas e tarefas na listagem principal.
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="flex gap-2 mt-6">
                <Button onClick={createProject} disabled={!newProject.name.trim()}>
                  Criar Projeto
                </Button>
                <Button variant="outline" onClick={() => setShowNewProject(false)}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Projects List */}
        <div className="space-y-4">
          {filteredProjects.length === 0 ? (
            <Card className="shadow-sm">
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  {searchTerm ? 'Nenhum projeto encontrado com o termo buscado.' : 'Nenhum projeto encontrado. Crie seu primeiro projeto!'}
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredProjects.map((project) => (
              <Card key={project.id} className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleProjectExpansion(project.id)}
                      >
                        {expandedProjects.has(project.id) ? (
                          <FolderOpen className="h-4 w-4" />
                        ) : (
                          <FolderClosed className="h-4 w-4" />
                        )}
                      </Button>
                      <div>
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        {project.description && (
                          <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateProject(project.id, { 
                          status: project.status === 'aberto' ? 'fechado' : 'aberto' 
                        })}
                      >
                        {project.status === 'aberto' ? (
                          <CheckCircle className="h-4 w-4 text-success" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                      <Badge variant={project.status === 'aberto' ? 'default' : 'secondary'}>
                        {project.status}
                      </Badge>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Projeto</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o projeto "{project.name}"? 
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteProject(project.id)}>
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>

                {expandedProjects.has(project.id) && (
                  <CardContent className="space-y-6">
                    {/* Stages */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium">Etapas</h3>
                      </div>

                      {/* New Stage Form */}
                      <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            placeholder="Nome da etapa"
                            value={newStage[project.id]?.name || ''}
                            onChange={(e) => setNewStage(prev => ({
                              ...prev,
                              [project.id]: { ...(prev[project.id] || { name: '', description: '' }), name: e.target.value }
                            }))}
                          />
                          <Input
                            placeholder="Descrição (opcional)"
                            value={newStage[project.id]?.description || ''}
                            onChange={(e) => setNewStage(prev => ({
                              ...prev,
                              [project.id]: { ...(prev[project.id] || { name: '', description: '' }), description: e.target.value }
                            }))}
                          />
                        </div>
                        <Button
                          size="sm"
                          onClick={() => createStage(project.id)}
                          disabled={!newStage[project.id]?.name?.trim()}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar Etapa
                        </Button>
                      </div>

                      {/* Stages List */}
                      {stages[project.id]?.map((stage) => (
                        <Collapsible key={stage.id}>
                          <div className="border border-border rounded-lg p-4 space-y-3">
                            <CollapsibleTrigger asChild>
                              <div className="flex items-center justify-between cursor-pointer">
                                <div className="flex items-center gap-2">
                                  <ChevronDown className="h-4 w-4 transition-transform" />
                                  <div>
                                    <h4 className="font-medium">{stage.name}</h4>
                                    {stage.description && (
                                      <p className="text-sm text-muted-foreground">{stage.description}</p>
                                    )}
                                  </div>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {tasks[stage.id]?.length || 0} tarefas
                                </Badge>
                              </div>
                            </CollapsibleTrigger>

                            <CollapsibleContent className="space-y-3">
                              {/* Tasks */}
                              <div className="ml-6 space-y-2">
                                <h5 className="text-sm font-medium text-muted-foreground">Tarefas</h5>
                                
                                {/* New Task Form */}
                                <div className="bg-muted/30 p-3 rounded space-y-2">
                                  <div className="grid grid-cols-2 gap-2">
                                    <Input
                                      placeholder="Nome da tarefa"
                                      value={newTask[stage.id]?.name || ''}
                                      onChange={(e) => setNewTask(prev => ({
                                        ...prev,
                                        [stage.id]: { ...(prev[stage.id] || { name: '', description: '' }), name: e.target.value }
                                      }))}
                                    />
                                    <Input
                                      placeholder="Descrição (opcional)"
                                      value={newTask[stage.id]?.description || ''}
                                      onChange={(e) => setNewTask(prev => ({
                                        ...prev,
                                        [stage.id]: { ...(prev[stage.id] || { name: '', description: '' }), description: e.target.value }
                                      }))}
                                    />
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={() => createTask(stage.id)}
                                    disabled={!newTask[stage.id]?.name?.trim()}
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Adicionar Tarefa
                                  </Button>
                                </div>

                                {/* Tasks List */}
                                {tasks[stage.id]?.map((task) => (
                                  <div key={task.id} className="bg-background border border-border rounded p-3">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <div className="font-medium text-sm">{task.name}</div>
                                        {task.description && (
                                          <div className="text-xs text-muted-foreground mt-1">{task.description}</div>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="sm">
                                          <Edit2 className="h-3 w-3" />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-destructive">
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ))}

                                {(!tasks[stage.id] || tasks[stage.id].length === 0) && (
                                  <div className="text-center text-sm text-muted-foreground py-4">
                                    Nenhuma tarefa criada nesta etapa
                                  </div>
                                )}
                              </div>
                            </CollapsibleContent>
                          </div>
                        </Collapsible>
                      ))}

                      {(!stages[project.id] || stages[project.id].length === 0) && (
                        <div className="text-center text-sm text-muted-foreground py-8 border-2 border-dashed border-border rounded-lg">
                          Nenhuma etapa criada neste projeto
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}