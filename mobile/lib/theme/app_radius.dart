import 'package:flutter/widgets.dart';

abstract final class AppRadius {
  static const double small = 8;
  static const double medium = 12;
  static const double card = 16;
  static const double large = 20;

  static const BorderRadius smallBorder = BorderRadius.all(
    Radius.circular(small),
  );
  static const BorderRadius mediumBorder = BorderRadius.all(
    Radius.circular(medium),
  );
  static const BorderRadius cardBorder = BorderRadius.all(
    Radius.circular(card),
  );
  static const BorderRadius largeBorder = BorderRadius.all(
    Radius.circular(large),
  );
}
