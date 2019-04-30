import { ITreeNode } from './abstractNode';
import { FolderNode } from './folderNode';

export class SortUtil {
    static sort(node1: ITreeNode, node2: ITreeNode): number {
        if (node1 instanceof FolderNode && !(node2 instanceof FolderNode)) {
            return -1;
        }

        if (node2 instanceof FolderNode && !(node1 instanceof FolderNode)) {
            return 1;
        }

        return SortUtil.compare((node1 as ITreeNode).getLabel(), (node2 as ITreeNode).getLabel());
    }
    static compare(one: string | null, other: string | null): number {
        const a = one || '';
        const b = other || '';
        const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
        const result = collator.compare(a, b);
        if (result === 0 && a !== b) {
            return a < b ? -1 : 1;
        }
        return result;
    }
}