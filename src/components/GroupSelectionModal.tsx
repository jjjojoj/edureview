import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Plus, Users, Group } from 'lucide-react';
import toast from 'react-hot-toast';

interface StudentGroup {
  id: number;
  name: string;
  description?: string;
  color: string;
  _count: {
    students: number;
  };
}

interface GroupSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: {
    id: number;
    name: string;
    group?: { id: number; name: string } | null;
  };
  groups: StudentGroup[];
  onAssignToGroup: (studentId: number, groupId: number | null) => Promise<void>;
  onCreateGroup: (name: string, description?: string, color?: string) => Promise<void>;
}

export function GroupSelectionModal({
  isOpen,
  onClose,
  student,
  groups,
  onAssignToGroup,
  onCreateGroup,
}: GroupSelectionModalProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('blue');
  const [loading, setLoading] = useState(false);

  const colorOptions = [
    { value: 'blue', label: '蓝色', class: 'bg-blue-500' },
    { value: 'green', label: '绿色', class: 'bg-green-500' },
    { value: 'purple', label: '紫色', class: 'bg-purple-500' },
    { value: 'red', label: '红色', class: 'bg-red-500' },
    { value: 'yellow', label: '黄色', class: 'bg-yellow-500' },
    { value: 'indigo', label: '靛蓝', class: 'bg-indigo-500' },
  ];

  const handleAssignToGroup = async (groupId: number | null) => {
    if (loading) return;

    setLoading(true);
    try {
      await onAssignToGroup(student.id, groupId);
      onClose();
    } catch (error) {
      // Error is handled by parent component
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (loading || !newGroupName.trim()) return;

    setLoading(true);
    try {
      await onCreateGroup(newGroupName.trim(), newGroupDescription.trim() || undefined, newGroupColor);
      setNewGroupName('');
      setNewGroupDescription('');
      setNewGroupColor('blue');
      setShowCreateForm(false);
      toast.success('小组创建成功！');
    } catch (error) {
      // Error is handled by parent component
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className="text-lg font-bold text-gray-900">
                    分配学生到小组
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    学生: <span className="font-semibold text-gray-900">{student.name}</span>
                  </p>
                  {student.group && (
                    <p className="text-sm text-gray-500 mt-1">
                      当前小组: {student.group.name}
                    </p>
                  )}
                </div>

                <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
                  {/* Remove from group option */}
                  {student.group && (
                    <button
                      onClick={() => handleAssignToGroup(null)}
                      disabled={loading}
                      className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors disabled:opacity-50"
                    >
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-gray-300 rounded-full mr-3"></div>
                        <div>
                          <div className="font-medium text-red-700">移出小组</div>
                          <div className="text-sm text-gray-500">将学生从当前小组中移出</div>
                        </div>
                      </div>
                    </button>
                  )}

                  {/* Existing groups */}
                  {groups.map((group) => (
                    <button
                      key={group.id}
                      onClick={() => handleAssignToGroup(group.id)}
                      disabled={loading || student.group?.id === group.id}
                      className={`w-full p-3 text-left border rounded-lg transition-colors disabled:opacity-50 ${
                        student.group?.id === group.id
                          ? 'border-blue-200 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full mr-3 ${
                          colorOptions.find(c => c.value === group.color)?.class || 'bg-blue-500'
                        }`}></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900">{group.name}</span>
                            <span className="text-sm text-gray-500">{group._count.students} 人</span>
                          </div>
                          {group.description && (
                            <p className="text-sm text-gray-500 mt-1">{group.description}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}

                  {/* Create new group section */}
                  {!showCreateForm ? (
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="w-full p-3 text-left border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex items-center">
                        <Plus className="w-4 h-4 text-gray-400 mr-3" />
                        <span className="text-gray-600">创建新小组</span>
                      </div>
                    </button>
                  ) : (
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <h4 className="font-medium text-gray-900 mb-3">创建新小组</h4>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            小组名称 *
                          </label>
                          <input
                            type="text"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="例如：第一组"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            小组描述
                          </label>
                          <input
                            type="text"
                            value={newGroupDescription}
                            onChange={(e) => setNewGroupDescription(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="可选的描述信息"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            小组颜色
                          </label>
                          <div className="flex space-x-2">
                            {colorOptions.map((color) => (
                              <button
                                key={color.value}
                                onClick={() => setNewGroupColor(color.value)}
                                className={`w-8 h-8 rounded-full ${color.class} ${
                                  newGroupColor === color.value
                                    ? 'ring-2 ring-gray-800 ring-offset-2'
                                    : 'hover:ring-2 hover:ring-gray-400 hover:ring-offset-1'
                                } transition-all`}
                                title={color.label}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="flex space-x-2 pt-2">
                          <button
                            onClick={handleCreateGroup}
                            disabled={loading || !newGroupName.trim()}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                          >
                            创建小组
                          </button>
                          <button
                            onClick={() => {
                              setShowCreateForm(false);
                              setNewGroupName('');
                              setNewGroupDescription('');
                              setNewGroupColor('blue');
                            }}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}