import { generateMovements, type Event, type Movement, type MovementContext } from "@finance-os/domain";
import type { EventRepository, IdGenerator, MovementRepository, Persistence } from "../ports";

export interface RegisterEventDeps {
  events: EventRepository;
  movements: MovementRepository;
  persistence: Persistence;
  ids: IdGenerator;
}

// Persiste un Event ya construido junto con los Movement que el motor financiero
// deriva de él, y guarda la base de datos. Compartido por todos los casos de uso
// que registran un evento.
export async function persistEvent(
  deps: RegisterEventDeps,
  event: Event,
  context?: MovementContext,
): Promise<Event> {
  const drafts = generateMovements(event, context);
  const movements: Movement[] = drafts.map((draft) => ({
    id: deps.ids.generate(),
    eventId: event.id,
    accountId: draft.accountId,
    amount: draft.amount,
    date: event.date,
    createdAt: event.createdAt,
  }));

  deps.events.insert(event);
  deps.movements.insertMany(movements);
  await deps.persistence.save();

  return event;
}
