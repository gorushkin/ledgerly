import { db } from 'src/db';

export abstract class BaseRepository {
  protected db = db;
}
