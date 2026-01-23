/**
 * List Picker Modal - Let user choose which list to add item to
 */

import { Modal, View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getAllLists, createList, ShoppingList, calculateListTotal } from '@/utils/listService';

interface ListPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectList: (listId: string) => void;
  category?: string; // Category name for creating category-specific list
}

export default function ListPickerModal({
  visible,
  onClose,
  onSelectList,
  category,
}: ListPickerModalProps) {
  const lists = getAllLists();
  const categoryListName = category ? `${category} List` : null;

  const handleCreateNewList = () => {
    Alert.prompt(
      'Create New List',
      'Enter a name for your list:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: (name) => {
            if (name && name.trim()) {
              const newList = createList(name.trim());
              onSelectList(newList.id);
              onClose();
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const handleCreateCategoryList = () => {
    if (!categoryListName) return;
    const newList = createList(categoryListName);
    onSelectList(newList.id);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'flex-end',
      }}>
        <View style={{
          backgroundColor: '#151B28',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingTop: 24,
          paddingBottom: 32,
          maxHeight: '80%',
        }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 24,
            marginBottom: 24,
          }}>
            <Text style={{
              fontSize: 20,
              fontWeight: '700',
              color: '#FFFFFF',
            }}>
              Add to List
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <View style={{ paddingHorizontal: 24, gap: 12 }}>
              {/* Create Category List (if category provided) */}
              {categoryListName && !lists.find(l => l.name === categoryListName) && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleCreateCategoryList}
                  style={{
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: 12,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: 'rgba(59, 130, 246, 0.3)',
                    borderStyle: 'dashed',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Ionicons name="add-circle-outline" size={24} color="#3B82F6" />
                    <View style={{ flex: 1 }}>
                      <Text style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: '#FFFFFF',
                        marginBottom: 4,
                      }}>
                        Create {categoryListName}
                      </Text>
                      <Text style={{ fontSize: 12, color: '#94A3B8' }}>
                        New list for {category} items
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}

              {/* Existing Lists */}
              {lists.map((list) => {
                const totals = calculateListTotal(list);
                return (
                  <TouchableOpacity
                    key={list.id}
                    activeOpacity={0.8}
                    onPress={() => {
                      onSelectList(list.id);
                      onClose();
                    }}
                    style={{
                      backgroundColor: 'rgba(15, 23, 42, 0.6)',
                      borderRadius: 12,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: 'rgba(148, 163, 184, 0.1)',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{
                          fontSize: 16,
                          fontWeight: '600',
                          color: '#FFFFFF',
                          marginBottom: 4,
                        }}>
                          {list.name}
                        </Text>
                        <Text style={{ fontSize: 14, color: '#94A3B8' }}>
                          {list.items.length} item{list.items.length !== 1 ? 's' : ''}
                          {totals.total > 0 ? ` • $${totals.total.toFixed(2)}` : ''}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                    </View>
                  </TouchableOpacity>
                );
              })}

              {/* Create New List Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleCreateNewList}
                style={{
                  marginTop: 8,
                  paddingVertical: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 8,
                }}
              >
                <Ionicons name="add" size={20} color="#3B82F6" />
                <Text style={{
                  color: '#3B82F6',
                  fontSize: 16,
                  fontWeight: '600',
                }}>
                  Create New List
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}


