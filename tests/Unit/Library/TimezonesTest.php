<?php

namespace Tests\Unit\Library;

use DateTimeImmutable;
use DateTimeZone;
use ReflectionClass;
use Tests\TestCase;
use Timezones;

class TimezonesTest extends TestCase
{
    private function timezones(): Timezones
    {
        require_once APPPATH . 'libraries/Timezones.php';

        // The constructor only loads CodeIgniter dependencies that the timezone list does not need.
        return (new ReflectionClass(Timezones::class))->newInstanceWithoutConstructor();
    }

    public function testGroupedArrayContainsOnlyCurrentIdentifiers()
    {
        $grouped = $this->timezones()->to_grouped_array();

        $this->assertSame(['UTC' => 'UTC'], $grouped['UTC']);
        $this->assertArrayHasKey('Europe/Berlin', $grouped['Europe']);
        $this->assertArrayNotHasKey('Asia/Calcutta', $grouped['Asia']); // Deprecated alias of "Asia/Kolkata".
    }

    public function testLabelsContainThePaddedOffsetThatIsCurrentlyInEffect()
    {
        $timezones = $this->timezones()->to_array();

        foreach (['Europe/Berlin', 'America/St_Johns', 'Pacific/Marquesas', 'Asia/Kolkata'] as $identifier) {
            $offset = (new DateTimeZone($identifier))->getOffset(new DateTimeImmutable());

            $expected = sprintf(
                '(%s%02d:%02d)',
                $offset < 0 ? '-' : '+',
                intdiv(abs($offset), 3600),
                intdiv(abs($offset) % 3600, 60),
            );

            $this->assertStringContainsString($expected, $timezones[$identifier]);
            $this->assertStringNotContainsString('_', $timezones[$identifier]);
        }
    }

    public function testFlatArrayResolvesDeprecatedIdentifiers()
    {
        $timezones = $this->timezones();

        // Deprecated identifiers are not offered for selection, but existing records may still hold one of
        // them, so they must resolve to a label as well. Which identifiers count as deprecated changes with
        // every timezone database release (e.g. "Asia/Calcutta" was retired altogether), so the list is read
        // from the runtime instead of being hardcoded to one entry.
        $current = DateTimeZone::listIdentifiers();
        $deprecated = array_values(array_diff(DateTimeZone::listIdentifiers(DateTimeZone::ALL_WITH_BC), $current));

        $this->assertNotEmpty($deprecated, 'The runtime is expected to know at least one deprecated identifier.');

        $resolved = [];

        foreach ($deprecated as $identifier) {
            $label = $timezones->get_timezone_name($identifier);

            if ($label === null) {
                // The list also contains entries that are not timezones at all (e.g. "leapseconds").
                continue;
            }

            $resolved[$identifier] = $label;

            $this->assertMatchesRegularExpression('/^.+\s\([+-]\d{2}:\d{2}\)$/', $label, $identifier);
        }

        $this->assertNotEmpty($resolved, 'At least one deprecated identifier has to resolve to a label.');

        $this->assertNull($timezones->get_timezone_name('Not/AZone'));
    }
}
