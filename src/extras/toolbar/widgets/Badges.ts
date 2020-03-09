import { GraphCollection } from "../../../metadata/configurations";
import utils from "../../utils";

export default class Badges {
  protected badgesArray: Array<HTMLSpanElement> = [];

  private dateWindow: [number, number] = [0, 0];

  constructor(
    public parentElement: Element,
    public collection: Array<GraphCollection>,
    public collectionSelectionListener?: (
      collections: Array<GraphCollection>
    ) => void
  ) {
    this.initDom();
  }

  /**
   *
   * @param label
   */
  private lockOrUnlockInterval = (label: string | null) => {
    if (label && this.collection) {
      this.collection.map(_coll => {
        if (_coll.label === label) {
          _coll.locked = !_coll.locked;
          if (_coll.locked) {
            // update style
            this.badgesArray.map(badge => {
              if (_coll.name === badge.getAttribute("data-fgp-badge")) {
                // change color
                badge.setAttribute(
                  "class",
                  "badge badge-pill badge-warning badge-interval"
                );
              } else {
                badge.setAttribute(
                  "class",
                  "badge badge-pill badge-secondary badge-interval"
                );
              }
            });
            console.log(`update to locked!`);
          } else if (!_coll.locked) {
            this.badgesArray.map(badge => {
              if (_coll.name === badge.getAttribute("data-fgp-badge")) {
                // change color
                badge.setAttribute(
                  "class",
                  "badge badge-pill badge-success badge-interval"
                );
              } else {
                badge.setAttribute(
                  "class",
                  "badge badge-pill badge-secondary badge-interval"
                );
              }
            });

            // need to find a collection base on date window
            const bestCollection = utils.findBestCollection(
              this.collection,
              this.dateWindow
            );

            this.badgesArray.map(badge => {
              if (
                bestCollection &&
                bestCollection.name === badge.getAttribute("data-fgp-badge")
              ) {
                // change color
                badge.setAttribute(
                  "class",
                  "badge badge-pill badge-success badge-interval"
                );
              } else {
                badge.setAttribute(
                  "class",
                  "badge badge-pill badge-secondary badge-interval"
                );
              }
            });

            console.log(`update to unlocked!`);
          }
        } else {
          _coll.locked = false;
        }
      });
    }

    if (this.collectionSelectionListener && this.collection) {
      // update collections
      const bestCollection = utils.findBestCollection(
        this.collection,
        this.dateWindow
      );
      this.collection.map(_collection => {
        _collection.show = _collection.name === bestCollection?.name;
      });

      this.collectionSelectionListener(this.collection);
    }
  };

  private initDom = () => {
    //
    let badgesContainer: HTMLDivElement = document.createElement("div");
    badgesContainer.setAttribute("class", "fgp-interval-labels");

    this.collection.forEach(coll => {
      let badge: HTMLSpanElement = document.createElement("span");
      badge.textContent = coll.label;
      badge.setAttribute("data-fgp-badge", coll.name);
      badge.setAttribute(
        "class",
        "badge badge-pill badge-secondary badge-interval"
      );
      badge.setAttribute("data-interval-locked", "false");
      badge.setAttribute("data-interval-name", coll.label);
      badge.setAttribute("data-interval-value", coll.interval + "");
      badge.addEventListener("click", (e: MouseEvent) => {
        if (e && e.currentTarget) {
          const span: HTMLSpanElement = <HTMLSpanElement>e.currentTarget;
          this.lockOrUnlockInterval(span.textContent);
        }
      });
      badgesContainer.appendChild(badge);
      this.badgesArray.push(badge);
    });
    this.parentElement.appendChild(badgesContainer);
  };

  /**
   * current collection
   * @param collection
   */
  public autoSelect = (collection: GraphCollection) => {
    console.log("update badge labels");
    this.badgesArray.map(badge => {
      if (collection.name === badge.getAttribute("data-fgp-badge")) {
        // change color
        badge.setAttribute(
          "class",
          "badge badge-pill badge-success badge-interval"
        );
      } else {
        badge.setAttribute(
          "class",
          "badge badge-pill badge-secondary badge-interval"
        );
      }
    });
  };

  /**
   * 2 numbers
   * @param dateWindow
   */
  public setDateWindow = (dateWindow: Array<number>) => {
    // check if different
    if (
      this.dateWindow[0] !== dateWindow[0] ||
      this.dateWindow[1] !== dateWindow[1]
    ) {
      this.dateWindow = [dateWindow[0], dateWindow[1]];
      console.log(`badge dateWindow has been updated! `, this.dateWindow);
    }
  };
}
