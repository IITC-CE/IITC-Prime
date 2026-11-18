// Copyright (C) 2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

// Material 3 top app bar and search, Android only.

import { View, Utils } from '@nativescript/core';

const resourceId = (context, name, type) =>
  context.getResources().getIdentifier(name, type, context.getPackageName());

// The app theme predates the M3 surface roles these widgets are colored with, see styles.xml
const themed = (context, style) =>
  new androidx.appcompat.view.ContextThemeWrapper(context, resourceId(context, style, 'style'));

const getDrawable = (context, name) => {
  const id = resourceId(context, name, 'drawable');
  return id ? androidx.appcompat.content.res.AppCompatResources.getDrawable(context, id) : null;
};

// The first shown view in the tree that scrolls vertically
const findVerticalScroll = view => {
  if (!view.isShown()) return null;
  if (view.canScrollVertically(1) || view.canScrollVertically(-1)) return view;
  if (!(view instanceof android.view.ViewGroup)) return null;
  for (let i = 0; i < view.getChildCount(); i++) {
    const found = findVerticalScroll(view.getChildAt(i));
    if (found) return found;
  }
  return null;
};

/**
 * AppBarLayout holding a MaterialToolbar, or a SearchBar when `search` is set, and text buttons.
 * Events: navigationTap, actionTap ({ index }).
 */
export class TopAppBar extends View {
  constructor() {
    super();
    this.search = false;
    this.navigationText = '';
    this._title = '';
    this._hint = '';
    this._actions = [];
  }

  get title() {
    return this._title;
  }
  set title(value) {
    this._title = value || '';
    if (this.bar && !this.search) this.bar.setTitle(this._title);
  }

  get hint() {
    return this._hint;
  }
  set hint(value) {
    this._hint = value || '';
    if (this.bar && this.search) this.bar.setHint(this._hint);
  }

  // [{ text }], shown as text buttons
  get actions() {
    return this._actions;
  }
  set actions(value) {
    this._actions = value || [];
    this._updateActions();
  }

  createNativeView() {
    const context = themed(this._context, 'AppTopBarOverlay');
    const appBar = new com.google.android.material.appbar.AppBarLayout(context);
    appBar.setLiftable(true);

    // The actions follow the bar in a row: a search bar would otherwise take them into its pill
    const row = new android.widget.LinearLayout(context);
    row.setGravity(android.view.Gravity.CENTER_VERTICAL);
    this.bar = this.search
      ? new com.google.android.material.search.SearchBar(context)
      : new com.google.android.material.appbar.MaterialToolbar(context);
    row.addView(this.bar, new android.widget.LinearLayout.LayoutParams(0, -2, 1));
    this._actionRow = row;
    appBar.addView(row, new com.google.android.material.appbar.AppBarLayout.LayoutParams(-1, -2));

    // Lifts while the page below is scrolled. Outside a CoordinatorLayout the bar can't follow a
    // scrolling view, but the window reports every scroll. A new listener per attach: once removed,
    // nothing on the Java side keeps the old one.
    let scrollListener = null;
    // Looked up again only once it's gone: walking the page on every scrolled frame is too slow
    let scrollingView = null;
    appBar.addOnAttachStateChangeListener(
      new android.view.View.OnAttachStateChangeListener({
        onViewAttachedToWindow(view) {
          scrollListener = new android.view.ViewTreeObserver.OnScrollChangedListener({
            onScrollChanged() {
              if (!scrollingView?.isShown()) scrollingView = findVerticalScroll(view.getParent());
              view.setLifted(!!scrollingView?.canScrollVertically(-1));
            },
          });
          view.getViewTreeObserver().addOnScrollChangedListener(scrollListener);
        },
        onViewDetachedFromWindow(view) {
          view.getViewTreeObserver().removeOnScrollChangedListener(scrollListener);
          scrollListener = null;
          scrollingView = null;
        },
      })
    );
    return appBar;
  }

  initNativeView() {
    super.initNativeView();
    const bar = this.bar;
    const owner = new WeakRef(this);

    bar.setNavigationIcon(getDrawable(bar.getContext(), 'abc_ic_ab_back_material'));
    bar.setNavigationContentDescription(this.navigationText);
    bar.setNavigationOnClickListener(
      new android.view.View.OnClickListener({
        onClick() {
          const view = owner.deref();
          view?.notify({ eventName: 'navigationTap', object: view });
        },
      })
    );
    if (this.search) bar.setHint(this._hint);
    else bar.setTitle(this._title);
    this._updateActions();
  }

  disposeNativeView() {
    this.bar = null;
    this._actionRow = null;
    super.disposeNativeView();
  }

  /** Status bar and side insets, in DIP: the page consumes them, so the bar pads itself */
  setInsets({ top, left, right }) {
    const toPx = Utils.layout.toDevicePixels;
    // SearchView opens from the search bar's position within its parent, so the insets go there
    this._actionRow?.setPadding(toPx(left), toPx(top), toPx(right), 0);
  }

  // M3 text buttons rather than menu items, whose ripple is a circle sized for an icon
  _createActionButton(action, index) {
    const button = new com.google.android.material.button.MaterialButton(this.bar.getContext());
    button.setText(action.text);
    const owner = new WeakRef(this);
    button.setOnClickListener(
      new android.view.View.OnClickListener({
        onClick() {
          const view = owner.deref();
          view?.notify({ eventName: 'actionTap', object: view, index });
        },
      })
    );
    return button;
  }

  _updateActions() {
    const row = this._actionRow;
    if (!row) return;
    row.removeViews(1, row.getChildCount() - 1);
    this._actions.forEach((action, index) => {
      const params = new android.widget.LinearLayout.LayoutParams(-2, -2);
      params.setMarginEnd(Utils.layout.toDevicePixels(8));
      row.addView(this._createActionButton(action, index), params);
    });
  }
}

/**
 * Full-screen SearchView expanding from a TopAppBar in search mode (see setupWithSearchBar).
 * Its single child view is shown as the search results.
 * Events: textChange ({ value }), stateChange ({ state }: SHOWING, SHOWN, HIDING, HIDDEN).
 */
export class SearchView extends View {
  constructor() {
    super();
    this._hint = '';
    this._content = null;
  }

  get hint() {
    return this._hint;
  }
  set hint(value) {
    this._hint = value || '';
    this.nativeViewProtected?.setHint(this._hint);
  }

  get isShowing() {
    return !!this.nativeViewProtected?.isShowing();
  }

  createNativeView() {
    return new com.google.android.material.search.SearchView(
      themed(this._context, 'AppSearchViewOverlay')
    );
  }

  initNativeView() {
    super.initNativeView();
    const searchView = this.nativeViewProtected;
    const owner = new WeakRef(this);

    searchView.setHint(this._hint);
    searchView.setVisible(false);
    // The search bar already shows the back arrow; fading it into the same arrow only flickers
    searchView.setAnimatedNavigationIcon(false);

    // The header keeps the color of the search bar it opens from, the results lie on the page color
    const context = searchView.getContext();
    const headerColor = androidx.core.content.ContextCompat.getColor(
      context,
      resourceId(context, 'surface_container', 'color')
    );
    ['open_search_view_status_bar_spacer', 'open_search_view_toolbar_container'].forEach(name =>
      searchView.findViewById(resourceId(context, name, 'id'))?.setBackgroundColor(headerColor)
    );
    searchView.getEditText().addTextChangedListener(
      new android.text.TextWatcher({
        beforeTextChanged() {},
        onTextChanged() {},
        afterTextChanged(text) {
          const view = owner.deref();
          view?.notify({ eventName: 'textChange', object: view, value: text.toString() });
        },
      })
    );
    searchView.addTransitionListener(
      new com.google.android.material.search.SearchView.TransitionListener({
        onStateChanged(_view, _previous, state) {
          const view = owner.deref();
          view?.notify({ eventName: 'stateChange', object: view, state: state.name() });
        },
      })
    );
  }

  /**
   * Status bar and side insets, in DIP: the page consumes window insets, so the view's own
   * listeners on the status bar spacer and the toolbar would see 0
   */
  setInsets({ top, left, right }) {
    const searchView = this.nativeViewProtected;
    if (!searchView) return;
    const ViewCompat = androidx.core.view.ViewCompat;
    const toPx = Utils.layout.toDevicePixels;

    const spacer = searchView.findViewById(
      resourceId(searchView.getContext(), 'open_search_view_status_bar_spacer', 'id')
    );
    if (spacer) {
      ViewCompat.setOnApplyWindowInsetsListener(spacer, null);
      searchView.setStatusBarSpacerEnabled(true);
      const params = spacer.getLayoutParams();
      params.height = toPx(top);
      spacer.setLayoutParams(params);
    }

    const toolbar = searchView.getToolbar();
    ViewCompat.setOnApplyWindowInsetsListener(toolbar, null);
    this._toolbarPadding ??= [toolbar.getPaddingLeft(), toolbar.getPaddingRight()];
    const [paddingLeft, paddingRight] = this._toolbarPadding;
    toolbar.setPadding(
      paddingLeft + toPx(left),
      toolbar.getPaddingTop(),
      paddingRight + toPx(right),
      toolbar.getPaddingBottom()
    );
  }

  setupWithSearchBar(topAppBar) {
    if (topAppBar?.search && topAppBar.bar) {
      this.nativeViewProtected?.setupWithSearchBar(topAppBar.bar);
    }
  }

  hide() {
    this.nativeViewProtected?.hide();
  }

  clearText() {
    this.nativeViewProtected?.clearText();
  }

  eachChild(callback) {
    if (this._content) callback(this._content);
  }

  _addChildFromBuilder(_name, value) {
    this._content = value;
    this._addView(value);
  }

  // SearchView.addView places children into its results container
  _addViewToNativeVisualTree(child) {
    super._addViewToNativeVisualTree(child);
    const searchView = this.nativeViewProtected;
    if (!searchView || !child.nativeViewProtected) return false;
    searchView.addView(child.nativeViewProtected);
    return true;
  }

  _removeView(view) {
    if (view === this._content) this._content = null;
    super._removeView(view);
  }

  // Also runs when the native views are torn down while the child stays, so _content is kept
  _removeViewFromNativeVisualTree(child) {
    const nativeChild = child.nativeViewProtected;
    nativeChild?.getParent()?.removeView(nativeChild);
    super._removeViewFromNativeVisualTree(child);
  }
}
