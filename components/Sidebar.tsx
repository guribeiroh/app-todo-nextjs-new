import React, { useState } from 'react';
import { 
  FiList, 
  FiCalendar, 
  FiStar, 
  FiClock, 
  FiPlus, 
  FiTrash2, 
  FiEdit2,
  FiCheckCircle
} from 'react-icons/fi';
import { useTaskContext } from '../app/context/TaskContext';

interface SidebarProps {
  isOpen: boolean;
}

// Cores mais vibrantes para o design moderno
const colors = [
  '#6366F1', // indigo
  '#10B981', // emerald
  '#F43F5E', // rose
  '#F59E0B', // amber
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const { lists, addList, deleteList, updateList, filter, setFilter } = useTaskContext();
  const [showNewListForm, setShowNewListForm] = useState(false);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [newListName, setNewListName] = useState('');
  const [selectedColor, setSelectedColor] = useState(colors[0]);

  const handleAddList = (e: React.FormEvent) => {
    e.preventDefault();
    if (newListName.trim()) {
      addList(newListName, selectedColor);
      setNewListName('');
      setSelectedColor(colors[0]);
      setShowNewListForm(false);
    }
  };

  const handleUpdateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingListId && newListName.trim()) {
      updateList(editingListId, { name: newListName, color: selectedColor });
      setEditingListId(null);
      setNewListName('');
    }
  };

  const startEditing = (list: typeof lists[0]) => {
    setEditingListId(list.id);
    setNewListName(list.name);
    setSelectedColor(list.color);
  };

  const handleFilterByList = (listId: string) => {
    setFilter({ ...filter, listId });
  };

  return (
    <>
      {/* Overlay para fechar o menu em dispositivos móveis */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-xs z-20 md:hidden"
          onClick={() => document.dispatchEvent(new Event('sidebar:close'))}
        />
      )}
    
      <aside
        className={`fixed left-0 top-0 h-full bg-dark-lighter border-r border-dark-accent transition-all duration-300 pt-16 z-20 w-64 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 h-full overflow-y-auto flex flex-col">
          <nav className="flex-grow">
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setFilter({ ...filter, status: 'todas', listId: 'todas' })}
                  className={`flex items-center w-full p-2 rounded-md hover:bg-dark-accent/60 transition-colors ${
                    filter.status === 'todas' && filter.listId === 'todas'
                      ? 'bg-dark-accent text-white'
                      : 'text-gray-300'
                  }`}
                >
                  <FiList className="mr-3 text-primary" size={20} />
                  <span>Todas as tarefas</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setFilter({ ...filter, status: 'pendentes' })}
                  className={`flex items-center w-full p-2 rounded-md hover:bg-dark-accent/60 transition-colors ${
                    filter.status === 'pendentes'
                      ? 'bg-dark-accent text-white'
                      : 'text-gray-300'
                  }`}
                >
                  <FiClock className="mr-3 text-accent" size={20} />
                  <span>Pendentes</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setFilter({ ...filter, priority: 'alta' })}
                  className={`flex items-center w-full p-2 rounded-md hover:bg-dark-accent/60 transition-colors ${
                    filter.priority === 'alta'
                      ? 'bg-dark-accent text-white'
                      : 'text-gray-300'
                  }`}
                >
                  <FiStar className="mr-3 text-warning" size={20} />
                  <span>Importante</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setFilter({ ...filter, status: 'concluídas' })}
                  className={`flex items-center w-full p-2 rounded-md hover:bg-dark-accent/60 transition-colors ${
                    filter.status === 'concluídas'
                      ? 'bg-dark-accent text-white'
                      : 'text-gray-300'
                  }`}
                >
                  <FiCheckCircle className="mr-3 text-secondary" size={20} />
                  <span>Concluídas</span>
                </button>
              </li>
            </ul>

            <div className="mt-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                  Minhas Listas
                </h3>
                <button
                  onClick={() => setShowNewListForm(!showNewListForm)}
                  className="text-primary hover:text-indigo-400 transition-colors"
                  aria-label="Adicionar nova lista"
                >
                  <FiPlus size={18} className="hover:rotate-90 transition-transform" />
                </button>
              </div>

              {showNewListForm && (
                <form onSubmit={handleAddList} className="mb-4 p-3 bg-dark-accent/40 rounded-md border border-dark-accent">
                  <input
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="Nome da lista"
                    className="input mb-3 bg-dark-card"
                    autoFocus
                  />
                  <div className="flex flex-wrap gap-2 mb-4">
                    {colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`w-7 h-7 rounded-full transition-all ${
                          selectedColor === color ? 'ring-2 ring-offset-2 ring-offset-dark-accent ring-white scale-110' : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: color }}
                        aria-label={`Selecionar cor ${color}`}
                      />
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <button type="submit" className="btn btn-primary text-sm flex-1 py-1.5">
                      Adicionar
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewListForm(false)}
                      className="btn bg-dark-accent text-gray-200 hover:bg-dark-lighter text-sm py-1.5"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}

              <ul className="space-y-1">
                {lists.map((list) => (
                  <li key={list.id}>
                    {editingListId === list.id ? (
                      <form onSubmit={handleUpdateList} className="p-3 bg-dark-accent/40 rounded-md border border-dark-accent">
                        <input
                          type="text"
                          value={newListName}
                          onChange={(e) => setNewListName(e.target.value)}
                          className="input mb-3 bg-dark-card"
                          autoFocus
                        />
                        <div className="flex flex-wrap gap-2 mb-3">
                          {colors.map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setSelectedColor(color)}
                              className={`w-6 h-6 rounded-full ${
                                selectedColor === color ? 'ring-2 ring-offset-1 ring-offset-dark-accent ring-white scale-110' : 'hover:scale-110'
                              }`}
                              style={{ backgroundColor: color }}
                              aria-label={`Selecionar cor ${color}`}
                            />
                          ))}
                        </div>
                        <div className="flex space-x-2">
                          <button type="submit" className="btn btn-primary text-xs py-1 flex-1">
                            Atualizar
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingListId(null)}
                            className="btn bg-dark-accent text-gray-200 hover:bg-dark-lighter text-xs py-1"
                          >
                            Cancelar
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex items-center group">
                        <button
                          onClick={() => handleFilterByList(list.id)}
                          className={`flex items-center flex-grow p-2 rounded-md hover:bg-dark-accent/60 transition-colors ${
                            filter.listId === list.id
                              ? 'bg-dark-accent text-white font-medium'
                              : 'text-gray-300'
                          }`}
                        >
                          <span
                            className="w-3 h-3 rounded-full mr-3"
                            style={{ backgroundColor: list.color }}
                          ></span>
                          <span className="truncate">{list.name}</span>
                        </button>
                        <div className="opacity-0 group-hover:opacity-100 flex pr-1 transition-opacity">
                          <button
                            onClick={() => startEditing(list)}
                            className="p-1 text-gray-400 hover:text-gray-200 transition-colors"
                            aria-label={`Editar lista ${list.name}`}
                          >
                            <FiEdit2 size={14} />
                          </button>
                          {/* Não permitir excluir a lista padrão */}
                          {list.id !== 'default' && (
                            <button
                              onClick={() => deleteList(list.id)}
                              className="p-1 text-gray-400 hover:text-danger transition-colors"
                              aria-label={`Excluir lista ${list.name}`}
                            >
                              <FiTrash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </nav>
          
          <div className="mt-auto pt-4 text-center">
            <p className="text-xs text-gray-500">
              NeoTask &copy; {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar; 