import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Plus, Package, X } from 'lucide-react'
import { Button, Card, Input, Modal } from '@/shared/ui'
import useBuilderStore from '@/stores/builderStore'
import AddComponentModal from '@/features/builder/AddComponentModal/AddComponentModal'
import ComponentCard from '@/features/builder/ComponentCard/ComponentCard'
import CompatibilityPanel from '@/features/builder/CompatibilityPanel/CompatibilityPanel'
import ReportMissing from '@/features/builder/ReportMissing/ReportMissing'
import styles from './Builder.module.css'

export default function BuilderPage() {
  const {
    builds,
    activeBuildId,
    categories,
    categoryLabels,
    createBuild,
    deleteBuild,
    setActiveBuild,
    addComponent,
    removeComponent,
    cycleComponentStatus,
    moveComponent,
    getActiveBuild,
    getComponentsByCategory,
    getTotalPrice,
    getCategoryPrice,
    getProgress,
    getStatusCounts,
  } = useBuilderStore()

  const [modalOpen, setModalOpen] = useState(false)
  const [modalCategory, setModalCategory] = useState('')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [newBuildName, setNewBuildName] = useState('')

  const activeBuild = getActiveBuild()
  const totalPrice = activeBuild ? getTotalPrice(activeBuild.id) : 0
  const progress = activeBuild ? getProgress(activeBuild.id) : 0
  const statusCounts = activeBuild ? getStatusCounts(activeBuild.id) : null

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  const handleCreateBuild = () => {
    if (!newBuildName.trim()) return
    createBuild(newBuildName.trim())
    setNewBuildName('')
    setCreateModalOpen(false)
  }

  const handleOpenModal = (category = '') => {
    setModalCategory(category)
    setModalOpen(true)
  }

  const handleAddComponent = (component) => {
    if (activeBuild) {
      addComponent(activeBuild.id, component)
    }
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id || !activeBuild) return
    moveComponent(activeBuild.id, active.id, over.id)
  }

  const allComponentIds = useMemo(
    () => activeBuild?.components.map((c) => c.id) || [],
    [activeBuild?.components]
  )

  return (
    <motion.div
      className={styles.builder}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className={styles.builder__header}>
        <h1 className={styles.builder__title}>
          Конструктор <span className="gradient-text">ПК</span>
        </h1>
        <div className={styles['builder__header-actions']}>
          {activeBuild && (
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => handleOpenModal()}
            >
              Добавить
            </Button>
          )}
          <Button variant="secondary" icon={Plus} onClick={() => setCreateModalOpen(true)}>
            Новая сборка
          </Button>
        </div>
      </div>

      {/* Build tabs */}
      {builds.length > 0 && (
        <div className={styles['build-selector']}>
          {builds.map((build) => (
            <div
              key={build.id}
              className={`${styles['build-tab']} ${
                build.id === activeBuildId ? styles['build-tab--active'] : ''
              }`}
              onClick={() => setActiveBuild(build.id)}
            >
              {build.name}
              <button
                className={styles['build-tab__delete']}
                onClick={(e) => {
                  e.stopPropagation()
                  deleteBuild(build.id)
                }}
                aria-label="Удалить сборку"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {activeBuild ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className={styles.builder__layout}>
            {/* Workspace */}
            <div className={styles.builder__workspace}>
              <SortableContext
                items={allComponentIds}
                strategy={verticalListSortingStrategy}
              >
                {categories.map((cat) => {
                  const catComponents = getComponentsByCategory(
                    activeBuild.id,
                    cat
                  )
                  const catPrice = getCategoryPrice(activeBuild.id, cat)

                  return (
                    <div key={cat} className={styles['category-zone']}>
                      <div className={styles['category-zone__header']}>
                        <span className={styles['category-zone__title']}>
                          {categoryLabels[cat]}
                          {catComponents.length > 0 && (
                            <span className={styles['category-zone__count']}>
                              ({catComponents.length})
                            </span>
                          )}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                          {catPrice > 0 && (
                            <span className={styles['category-zone__price']}>
                              {catPrice.toLocaleString('ru-RU')} ₽
                            </span>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Plus}
                            iconOnly
                            onClick={() => handleOpenModal(cat)}
                            aria-label={`Добавить ${categoryLabels[cat]}`}
                          />
                        </div>
                      </div>
                      <div className={styles['category-zone__body']}>
                        {catComponents.length > 0 ? (
                          catComponents.map((comp) => (
                            <ComponentCard
                              key={comp.id}
                              component={comp}
                              onStatusClick={(id) =>
                                cycleComponentStatus(activeBuild.id, id)
                              }
                              onDelete={(id) =>
                                removeComponent(activeBuild.id, id)
                              }
                            />
                          ))
                        ) : (
                          <div className={styles['category-zone__empty']}>
                            Перетащи или нажми +
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </SortableContext>
            </div>

            {/* Sidebar */}
            <div className={styles.sidebar}>
              <Card>
                <div className={styles['price-block']}>
                  <div className={styles['price-total']}>
                    <span className={styles['price-total__label']}>Итого</span>
                    <span className={styles['price-total__value']}>
                      {totalPrice.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>

                  <div className={styles.progress}>
                    <div className={styles.progress__bar}>
                      <div
                        className={styles.progress__fill}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className={styles.progress__label}>
                      <span>Прогресс покупок</span>
                      <span>{progress}%</span>
                    </div>
                  </div>

                  {statusCounts && (
                    <div className={styles['status-summary']}>
                      <div className={styles['status-item']}>
                        <span className={styles['status-item__count']}>
                          {statusCounts.planned}
                        </span>
                        планирую
                      </div>
                      <div className={styles['status-item']}>
                        <span className={styles['status-item__count']}>
                          {statusCounts.ordered}
                        </span>
                        заказано
                      </div>
                      <div className={styles['status-item']}>
                        <span className={styles['status-item__count']}>
                          {statusCounts.purchased}
                        </span>
                        куплено
                      </div>
                      <div className={styles['status-item']}>
                        <span className={styles['status-item__count']}>
                          {statusCounts.delivered}
                        </span>
                        доставлено
                      </div>
                    </div>
                  )}

                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                    {activeBuild.components.length} компонентов
                  </div>
                </div>
              </Card>

              {activeBuild.components.length > 0 && (
                <Card>
                  <CompatibilityPanel components={activeBuild.components} />
                </Card>
              )}

              <ReportMissing />
            </div>
          </div>
        </DndContext>
      ) : (
        <div className={styles.builder__empty}>
          <div className={styles['builder__empty-icon']}>
            <Package size={36} />
          </div>
          <h2 className={styles['builder__empty-title']}>Нет активных сборок</h2>
          <p className={styles['builder__empty-desc']}>
            Создай свою первую сборку и начни добавлять комплектующие. Мы подскажем если что-то не совместимо.
          </p>
          <Button variant="primary" size="lg" icon={Plus} onClick={() => setCreateModalOpen(true)}>
            Создать сборку
          </Button>
        </div>
      )}

      {/* Create Build Modal */}
      <Modal
        open={createModalOpen}
        onClose={() => { setCreateModalOpen(false); setNewBuildName('') }}
        title="Новая сборка"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setCreateModalOpen(false); setNewBuildName('') }}>
              Отмена
            </Button>
            <Button variant="primary" onClick={handleCreateBuild} disabled={!newBuildName.trim()}>
              Создать
            </Button>
          </>
        }
      >
        <form onSubmit={(e) => { e.preventDefault(); handleCreateBuild() }}>
          <Input
            label="Название сборки"
            placeholder="Игровой ПК 2026"
            value={newBuildName}
            onChange={(e) => setNewBuildName(e.target.value)}
            autoFocus
          />
        </form>
      </Modal>

      {/* Add Component Modal */}
      <AddComponentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={handleAddComponent}
        defaultCategory={modalCategory}
      />
    </motion.div>
  )
}
