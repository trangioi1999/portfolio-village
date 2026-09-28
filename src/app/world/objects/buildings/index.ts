import { BuildingId } from '../../../models/building.model';
import { BuildContext, VillageObject } from '../../utils/types';
import { createAboutHouse } from './about-house';
import { createAcademy } from './academy';
import { createCareerTower } from './career-tower';
import { createContactShrine } from './contact-shrine';
import { createPlaza } from './plaza';
import { createSkillsGarden } from './skills-garden';
import { createWorkshop } from './workshop';

/** Procedural builders per building. Add a new building by registering it here. */
export const BUILDING_FACTORIES: Record<BuildingId, (ctx: BuildContext) => VillageObject> = {
  plaza: createPlaza,
  career: createCareerTower,
  workshop: createWorkshop,
  garden: createSkillsGarden,
  academy: createAcademy,
  about: createAboutHouse,
  contact: createContactShrine,
};
